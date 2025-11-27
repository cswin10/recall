import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { transcribeAudio, analyzeEntry } from "@/lib/openai";
import { encrypt, getOrCreateUserDataKey } from "@/lib/crypto";

const MAX_DURATION_SECONDS = 600; // 10 minutes

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

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get("file") as File | null;
    const occurredAtParam = request.nextUrl.searchParams.get("occurred_at");

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg", "audio/x-m4a"];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json({ error: "Invalid audio format" }, { status: 400 });
    }

    // Check file size (rough duration estimate: ~1MB per minute for compressed audio)
    const maxSizeBytes = MAX_DURATION_SECONDS * 100000; // ~100KB per second
    if (audioFile.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `Audio file too large. Maximum duration is ${MAX_DURATION_SECONDS / 60} minutes.` },
        { status: 400 }
      );
    }

    const occurredAt = occurredAtParam ? new Date(occurredAtParam) : new Date();

    // Use service client for storage operations
    const serviceSupabase = await createServiceClient();

    // Upload audio to Supabase Storage
    const timestamp = Date.now();
    const extension = audioFile.type.split("/")[1] || "webm";
    const storagePath = `${user.id}/${timestamp}.${extension}`;

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const { error: uploadError } = await serviceSupabase.storage
      .from("journal-audio")
      .upload(storagePath, audioBuffer, {
        contentType: audioFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload audio" }, { status: 500 });
    }

    // Create audio asset record
    const { data: audioAsset, error: assetError } = await serviceSupabase
      .from("audio_assets")
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        mime_type: audioFile.type,
        file_size_bytes: audioFile.size,
      })
      .select("id")
      .single();

    if (assetError) {
      console.error("Audio asset insert error:", assetError);
      // Clean up uploaded file
      await serviceSupabase.storage.from("journal-audio").remove([storagePath]);
      return NextResponse.json({ error: "Failed to create audio record" }, { status: 500 });
    }

    // Transcribe audio with Whisper
    let transcript: string;
    try {
      transcript = await transcribeAudio(audioBuffer, audioFile.type);
    } catch (transcribeError) {
      console.error("Transcription error:", transcribeError);
      // Clean up
      await serviceSupabase.from("audio_assets").delete().eq("id", audioAsset.id);
      await serviceSupabase.storage.from("journal-audio").remove([storagePath]);
      return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
    }

    if (!transcript || transcript.trim().length === 0) {
      // Clean up
      await serviceSupabase.from("audio_assets").delete().eq("id", audioAsset.id);
      await serviceSupabase.storage.from("journal-audio").remove([storagePath]);
      return NextResponse.json({ error: "No speech detected in audio" }, { status: 400 });
    }

    // Get or create user's data key for encryption
    const dataKey = await getOrCreateUserDataKey(user.id, serviceSupabase);

    // Encrypt transcript
    const encryptedData = encrypt(transcript, dataKey);

    // Analyze entry for sentiment, mood, energy, and tags
    let analysis;
    try {
      analysis = await analyzeEntry(transcript);
    } catch (analysisError) {
      console.error("Analysis error:", analysisError);
      // Continue without analysis - set defaults
      analysis = {
        sentiment: "neutral" as const,
        mood: "reflective",
        energy: 5,
        tags: [],
      };
    }

    // Create entry
    const { data: entry, error: entryError } = await serviceSupabase
      .from("entries")
      .insert({
        user_id: user.id,
        audio_asset_id: audioAsset.id,
        text_encrypted: encryptedData.ciphertext,
        text_iv: encryptedData.iv,
        text_auth_tag: encryptedData.authTag,
        sentiment: analysis.sentiment,
        mood: analysis.mood,
        energy: analysis.energy,
        occurred_at: occurredAt.toISOString(),
      })
      .select("id")
      .single();

    if (entryError) {
      console.error("Entry insert error:", entryError);
      return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
    }

    // Create/link tags
    if (analysis.tags.length > 0) {
      for (const tagName of analysis.tags) {
        // Upsert tag
        const { data: tag } = await serviceSupabase
          .from("tags")
          .upsert(
            { user_id: user.id, name: tagName.toLowerCase() },
            { onConflict: "user_id,name" }
          )
          .select("id")
          .single();

        if (tag) {
          // Link tag to entry
          await serviceSupabase.from("entry_tags").insert({
            entry_id: entry.id,
            tag_id: tag.id,
          });
        }
      }
    }

    // Check if user wants to delete audio after transcription
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("delete_audio_after_transcription")
      .eq("user_id", user.id)
      .single();

    if (profile?.delete_audio_after_transcription) {
      // Delete audio from storage
      await serviceSupabase.storage.from("journal-audio").remove([storagePath]);
      // Update entry to remove audio reference
      await serviceSupabase
        .from("entries")
        .update({ audio_asset_id: null })
        .eq("id", entry.id);
      // Delete audio asset record
      await serviceSupabase.from("audio_assets").delete().eq("id", audioAsset.id);
    }

    return NextResponse.json({ entry_id: entry.id });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
