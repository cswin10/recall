import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { decrypt, getOrCreateUserDataKey } from "@/lib/crypto";
import type { DecryptedEntry, Tag } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSupabase = await createServiceClient();

    // Get entry with tags
    const { data: entry, error: entryError } = await serviceSupabase
      .from("entries")
      .select(
        `
        id,
        user_id,
        audio_asset_id,
        text_encrypted,
        text_iv,
        text_auth_tag,
        sentiment,
        mood,
        energy,
        occurred_at,
        created_at,
        updated_at,
        entry_tags (
          tags (
            id,
            user_id,
            name,
            created_at
          )
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Decrypt transcript
    const dataKey = await getOrCreateUserDataKey(user.id, serviceSupabase);
    let text: string;
    try {
      text = decrypt(
        {
          ciphertext: entry.text_encrypted,
          iv: entry.text_iv,
          authTag: entry.text_auth_tag,
        },
        dataKey
      );
    } catch (decryptError) {
      console.error("Decrypt error:", decryptError);
      return NextResponse.json({ error: "Failed to decrypt entry" }, { status: 500 });
    }

    // Extract tags
    const tags: Tag[] = [];
    if (entry.entry_tags && Array.isArray(entry.entry_tags)) {
      for (const et of entry.entry_tags) {
        if (et.tags) {
          tags.push(et.tags as Tag);
        }
      }
    }

    const result: DecryptedEntry = {
      id: entry.id,
      user_id: entry.user_id,
      audio_asset_id: entry.audio_asset_id,
      text,
      sentiment: entry.sentiment,
      mood: entry.mood,
      energy: entry.energy,
      occurred_at: entry.occurred_at,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      tags,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSupabase = await createServiceClient();

    // Get entry to find audio asset
    const { data: entry, error: entryError } = await serviceSupabase
      .from("entries")
      .select("id, audio_asset_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Get audio asset path if exists
    let storagePath: string | null = null;
    if (entry.audio_asset_id) {
      const { data: audioAsset } = await serviceSupabase
        .from("audio_assets")
        .select("storage_path")
        .eq("id", entry.audio_asset_id)
        .single();

      if (audioAsset) {
        storagePath = audioAsset.storage_path;
      }
    }

    // Delete embedding first (foreign key constraint)
    await serviceSupabase.from("entry_embeddings").delete().eq("entry_id", id);

    // Delete entry tags
    await serviceSupabase.from("entry_tags").delete().eq("entry_id", id);

    // Delete entry
    const { error: deleteError } = await serviceSupabase
      .from("entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Delete entry error:", deleteError);
      return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }

    // Delete audio asset and storage file
    if (entry.audio_asset_id) {
      await serviceSupabase.from("audio_assets").delete().eq("id", entry.audio_asset_id);

      if (storagePath) {
        await serviceSupabase.storage.from("journal-audio").remove([storagePath]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
