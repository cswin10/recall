import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/openai";
import { decrypt, getOrCreateUserDataKey } from "@/lib/crypto";

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
    const { entryId } = body;

    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();

    // Get entry (verify ownership via RLS)
    const { data: entry, error: entryError } = await serviceSupabase
      .from("entries")
      .select("id, user_id, text_encrypted, text_iv, text_auth_tag")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Check if embedding already exists
    const { data: existingEmbedding } = await serviceSupabase
      .from("entry_embeddings")
      .select("id")
      .eq("entry_id", entryId)
      .single();

    if (existingEmbedding) {
      return NextResponse.json({ message: "Embedding already exists" });
    }

    // Decrypt transcript
    const dataKey = await getOrCreateUserDataKey(user.id, serviceSupabase);
    const transcript = decrypt(
      {
        ciphertext: entry.text_encrypted,
        iv: entry.text_iv,
        authTag: entry.text_auth_tag,
      },
      dataKey
    );

    // Generate embedding
    const embedding = await generateEmbedding(transcript);

    // Store embedding
    const { error: embedError } = await serviceSupabase
      .from("entry_embeddings")
      .insert({
        entry_id: entryId,
        embedding: embedding,
      });

    if (embedError) {
      console.error("Embedding insert error:", embedError);
      return NextResponse.json({ error: "Failed to store embedding" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Embed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
