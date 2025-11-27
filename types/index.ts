export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  delete_audio_after_transcription: boolean;
  created_at: string;
  updated_at: string;
}

export interface AudioAsset {
  id: string;
  user_id: string;
  storage_path: string;
  duration_seconds: number | null;
  mime_type: string;
  file_size_bytes: number | null;
  created_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  audio_asset_id: string | null;
  text_encrypted: string;
  text_iv: string;
  text_auth_tag: string;
  sentiment: string | null;
  mood: string | null;
  energy: number | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface DecryptedEntry {
  id: string;
  user_id: string;
  audio_asset_id: string | null;
  text: string;
  sentiment: string | null;
  mood: string | null;
  energy: number | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface EntryEmbedding {
  id: string;
  entry_id: string;
  embedding: number[];
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface EntryTag {
  entry_id: string;
  tag_id: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  summary_date: string;
  summary: string;
  key_points: string[];
  decisions: string[];
  next_actions: string[];
  created_at: string;
  updated_at: string;
}

export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  summary: string;
  key_points: string[];
  decisions: string[];
  next_actions: string[];
  created_at: string;
  updated_at: string;
}

export interface MonthlySummary {
  id: string;
  user_id: string;
  month_start: string;
  summary: string;
  key_points: string[];
  decisions: string[];
  next_actions: string[];
  created_at: string;
  updated_at: string;
}

export interface UserKey {
  id: string;
  user_id: string;
  wrapped_data_key: string;
  created_at: string;
}

export interface EntryListItem {
  id: string;
  preview: string;
  sentiment: string | null;
  mood: string | null;
  energy: number | null;
  tags: Tag[];
  occurred_at: string;
  created_at: string;
}

export interface SearchResult {
  id: string;
  snippet: string;
  occurred_at: string;
  similarity: number;
}

export interface AnalysisResult {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  mood: string;
  energy: number;
  tags: string[];
}

export interface SummaryResult {
  summary: string;
  key_points: string[];
  decisions: string[];
  next_actions: string[];
}

export type Granularity = "daily" | "weekly" | "monthly";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}
