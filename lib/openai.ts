import OpenAI from "openai";
import type { AnalysisResult, SummaryResult } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  // Determine file extension from mime type
  const extensionMap: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/x-m4a": "m4a",
  };

  const extension = extensionMap[mimeType] || "webm";
  // Convert Buffer to ArrayBuffer for File constructor compatibility
  const arrayBuffer = audioBuffer.buffer.slice(
    audioBuffer.byteOffset,
    audioBuffer.byteOffset + audioBuffer.byteLength
  ) as ArrayBuffer;
  const file = new File([arrayBuffer], `audio.${extension}`, { type: mimeType });

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "text",
  });

  return response;
}

export async function analyzeEntry(transcript: string): Promise<AnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an AI assistant analyzing journal entries. Analyze the given transcript and return a JSON object with:
- sentiment: one of "positive", "negative", "neutral", or "mixed"
- mood: a single descriptive word for the overall mood (e.g., "reflective", "anxious", "excited", "peaceful", "frustrated")
- energy: a number from 1-10 representing the energy level (1 = very low/tired, 10 = very high/energetic)
- tags: an array of 3-8 relevant topic tags (lowercase, single words or short phrases)

Be concise and accurate. Focus on the main themes and emotional tone.`,
      },
      {
        role: "user",
        content: transcript,
      },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from analysis model");
  }

  const result = JSON.parse(content) as AnalysisResult;

  // Validate and normalize
  if (!["positive", "negative", "neutral", "mixed"].includes(result.sentiment)) {
    result.sentiment = "neutral";
  }
  if (typeof result.energy !== "number" || result.energy < 1 || result.energy > 10) {
    result.energy = 5;
  }
  if (!Array.isArray(result.tags)) {
    result.tags = [];
  }
  result.tags = result.tags.slice(0, 8).map((t) => t.toLowerCase().trim());

  return result;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

export async function generateSummary(
  entries: { text: string; occurred_at: string }[],
  granularity: "daily" | "weekly" | "monthly"
): Promise<SummaryResult> {
  if (entries.length === 0) {
    return {
      summary: "No entries for this period.",
      key_points: [],
      decisions: [],
      next_actions: [],
    };
  }

  const periodDescriptions = {
    daily: "day",
    weekly: "week",
    monthly: "month",
  };

  const entriesText = entries
    .map((e) => `[${new Date(e.occurred_at).toLocaleString()}]\n${e.text}`)
    .join("\n\n---\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an AI assistant creating ${periodDescriptions[granularity]} summaries for a personal journal. Analyze the journal entries and return a JSON object with:
- summary: a 2-4 sentence overview of the ${periodDescriptions[granularity]}
- key_points: an array of 3-5 main themes or events mentioned
- decisions: an array of any decisions mentioned (can be empty)
- next_actions: an array of any next steps or intentions mentioned (can be empty)

Be empathetic, insightful, and focus on patterns and themes. Use second person ("you") when referring to the journal writer.`,
      },
      {
        role: "user",
        content: `Here are the journal entries for this ${periodDescriptions[granularity]}:\n\n${entriesText}`,
      },
    ],
    max_tokens: 1000,
    temperature: 0.5,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from summary model");
  }

  const result = JSON.parse(content) as SummaryResult;

  // Ensure arrays exist
  result.key_points = Array.isArray(result.key_points) ? result.key_points : [];
  result.decisions = Array.isArray(result.decisions) ? result.decisions : [];
  result.next_actions = Array.isArray(result.next_actions) ? result.next_actions : [];

  return result;
}
