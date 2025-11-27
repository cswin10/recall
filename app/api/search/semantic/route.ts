import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/openai";
import { decrypt, getOrCreateUserDataKey } from "@/lib/crypto";
import { truncateText } from "@/lib/utils";
import type { SearchResult } from "@/types";

const SNIPPET_LENGTH = 200;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { query, limit = DEFAULT_LIMIT } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const effectiveLimit = Math.min(Math.max(1, limit), MAX_LIMIT);

    const serviceSupabase = await createServiceClient();

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query.trim());

    // Search using RPC
    const { data: matches, error: searchError } = await serviceSupabase.rpc(
      "search_entries_by_embedding",
      {
        p_user_id: user.id,
        p_query_embedding: queryEmbedding,
        p_limit: effectiveLimit,
      }
    );

    if (searchError) {
      console.error("Search error:", searchError);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Get user's data key for decryption
    const dataKey = await getOrCreateUserDataKey(user.id, serviceSupabase);

    // Fetch full entries and decrypt
    const results: SearchResult[] = [];

    for (const match of matches) {
      const { data: entry } = await serviceSupabase
        .from("entries")
        .select("text_encrypted, text_iv, text_auth_tag")
        .eq("id", match.entry_id)
        .single();

      if (entry) {
        try {
          const fullText = decrypt(
            {
              ciphertext: entry.text_encrypted,
              iv: entry.text_iv,
              authTag: entry.text_auth_tag,
            },
            dataKey
          );

          // Find relevant snippet around query terms
          const snippet = findRelevantSnippet(fullText, query, SNIPPET_LENGTH);

          results.push({
            id: match.entry_id,
            snippet,
            occurred_at: match.occurred_at,
            similarity: match.similarity,
          });
        } catch (decryptError) {
          console.error("Decrypt error for entry:", match.entry_id, decryptError);
        }
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function findRelevantSnippet(text: string, query: string, maxLength: number): string {
  const lowerText = text.toLowerCase();
  const queryTerms = query.toLowerCase().split(/\s+/);

  // Find the first occurrence of any query term
  let bestIndex = -1;
  for (const term of queryTerms) {
    const index = lowerText.indexOf(term);
    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
    }
  }

  if (bestIndex === -1) {
    // No query term found, return start of text
    return truncateText(text, maxLength);
  }

  // Calculate snippet boundaries
  const halfLength = Math.floor(maxLength / 2);
  let start = Math.max(0, bestIndex - halfLength);
  let end = Math.min(text.length, bestIndex + halfLength);

  // Adjust to word boundaries
  if (start > 0) {
    const spaceIndex = text.indexOf(" ", start);
    if (spaceIndex !== -1 && spaceIndex < bestIndex) {
      start = spaceIndex + 1;
    }
  }

  if (end < text.length) {
    const spaceIndex = text.lastIndexOf(" ", end);
    if (spaceIndex !== -1 && spaceIndex > bestIndex) {
      end = spaceIndex;
    }
  }

  let snippet = text.slice(start, end);

  // Add ellipses if needed
  if (start > 0) {
    snippet = "..." + snippet;
  }
  if (end < text.length) {
    snippet = snippet + "...";
  }

  return snippet;
}
