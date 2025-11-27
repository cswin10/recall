import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { decrypt, getOrCreateUserDataKey } from "@/lib/crypto";
import { truncateText } from "@/lib/utils";
import type { EntryListItem, PaginatedResponse, Tag } from "@/types";

const PAGE_SIZE = 20;
const PREVIEW_LENGTH = 200;

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cursor = request.nextUrl.searchParams.get("cursor");
    const keyword = request.nextUrl.searchParams.get("keyword");
    const tag = request.nextUrl.searchParams.get("tag");

    const serviceSupabase = await createServiceClient();

    // Build query
    let query = serviceSupabase
      .from("entries")
      .select(
        `
        id,
        text_encrypted,
        text_iv,
        text_auth_tag,
        sentiment,
        mood,
        energy,
        occurred_at,
        created_at,
        entry_tags (
          tags (
            id,
            name
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(PAGE_SIZE + 1); // Fetch one extra to check if there's more

    if (cursor) {
      query = query.lt("occurred_at", cursor);
    }

    if (tag) {
      // Filter by tag - need to join
      const { data: tagData } = await serviceSupabase
        .from("tags")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", tag.toLowerCase())
        .single();

      if (tagData) {
        const { data: entryIds } = await serviceSupabase
          .from("entry_tags")
          .select("entry_id")
          .eq("tag_id", tagData.id);

        if (entryIds && entryIds.length > 0) {
          query = query.in(
            "id",
            entryIds.map((e) => e.entry_id)
          );
        } else {
          // No entries with this tag
          return NextResponse.json({
            data: [],
            cursor: null,
            hasMore: false,
          } as PaginatedResponse<EntryListItem>);
        }
      }
    }

    const { data: entries, error: entriesError } = await query;

    if (entriesError) {
      console.error("Entries fetch error:", entriesError);
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        data: [],
        cursor: null,
        hasMore: false,
      } as PaginatedResponse<EntryListItem>);
    }

    // Get user's data key for decryption
    const dataKey = await getOrCreateUserDataKey(user.id, serviceSupabase);

    // Process entries
    const hasMore = entries.length > PAGE_SIZE;
    const entriesToReturn = hasMore ? entries.slice(0, PAGE_SIZE) : entries;

    const result: EntryListItem[] = [];

    for (const entry of entriesToReturn) {
      // Decrypt transcript
      let preview: string;
      try {
        const fullText = decrypt(
          {
            ciphertext: entry.text_encrypted,
            iv: entry.text_iv,
            authTag: entry.text_auth_tag,
          },
          dataKey
        );

        // If keyword filter, check if text contains keyword
        if (keyword && !fullText.toLowerCase().includes(keyword.toLowerCase())) {
          continue;
        }

        preview = truncateText(fullText, PREVIEW_LENGTH);
      } catch (decryptError) {
        console.error("Decrypt error for entry:", entry.id, decryptError);
        preview = "[Unable to decrypt]";
      }

      // Extract tags
      const tags: Tag[] = [];
      if (entry.entry_tags && Array.isArray(entry.entry_tags)) {
        for (const et of entry.entry_tags) {
          if (et.tags) {
            tags.push({
              id: et.tags.id,
              user_id: user.id,
              name: et.tags.name,
              created_at: "",
            });
          }
        }
      }

      result.push({
        id: entry.id,
        preview,
        sentiment: entry.sentiment,
        mood: entry.mood,
        energy: entry.energy,
        tags,
        occurred_at: entry.occurred_at,
        created_at: entry.created_at,
      });
    }

    const newCursor = entriesToReturn.length > 0 ? entriesToReturn[entriesToReturn.length - 1].occurred_at : null;

    return NextResponse.json({
      data: result,
      cursor: hasMore ? newCursor : null,
      hasMore,
    } as PaginatedResponse<EntryListItem>);
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
