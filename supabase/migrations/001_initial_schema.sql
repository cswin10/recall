-- Recall Journal Database Schema
-- This migration creates all necessary tables, RLS policies, and functions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- TABLES
-- ============================================

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    delete_audio_after_transcription BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User encryption keys (wrapped data keys)
CREATE TABLE IF NOT EXISTS user_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    wrapped_data_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio assets stored in Supabase Storage
CREATE TABLE IF NOT EXISTS audio_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    duration_seconds REAL,
    mime_type TEXT NOT NULL,
    file_size_bytes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries with encrypted transcripts
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    audio_asset_id UUID REFERENCES audio_assets(id) ON DELETE SET NULL,
    text_encrypted TEXT NOT NULL,
    text_iv TEXT NOT NULL,
    text_auth_tag TEXT NOT NULL,
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    mood TEXT,
    energy INTEGER CHECK (energy >= 1 AND energy <= 10),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS entry_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL UNIQUE REFERENCES entries(id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags for categorization
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Junction table for entries and tags
CREATE TABLE IF NOT EXISTS entry_tags (
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, tag_id)
);

-- Daily summaries
CREATE TABLE IF NOT EXISTS daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    summary TEXT NOT NULL,
    key_points JSONB DEFAULT '[]'::jsonb,
    decisions JSONB DEFAULT '[]'::jsonb,
    next_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, summary_date)
);

-- Weekly summaries
CREATE TABLE IF NOT EXISTS weekly_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    summary TEXT NOT NULL,
    key_points JSONB DEFAULT '[]'::jsonb,
    decisions JSONB DEFAULT '[]'::jsonb,
    next_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Monthly summaries
CREATE TABLE IF NOT EXISTS monthly_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_start DATE NOT NULL,
    summary TEXT NOT NULL,
    key_points JSONB DEFAULT '[]'::jsonb,
    decisions JSONB DEFAULT '[]'::jsonb,
    next_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_start)
);

-- ============================================
-- INDEXES
-- ============================================

-- Entries indexes
CREATE INDEX IF NOT EXISTS idx_entries_user_occurred_at
    ON entries(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_entries_user_created_at
    ON entries(user_id, created_at DESC);

-- Audio assets index
CREATE INDEX IF NOT EXISTS idx_audio_assets_user_id
    ON audio_assets(user_id);

-- Tags index
CREATE INDEX IF NOT EXISTS idx_tags_user_name
    ON tags(user_id, name);

-- Entry tags index
CREATE INDEX IF NOT EXISTS idx_entry_tags_entry
    ON entry_tags(entry_id);

-- Summaries indexes
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date
    ON daily_summaries(user_id, summary_date DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_week
    ON weekly_summaries(user_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_month
    ON monthly_summaries(user_id, month_start DESC);

-- Vector similarity search index (IVFFlat for performance)
CREATE INDEX IF NOT EXISTS idx_entry_embeddings_vector
    ON entry_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- User keys policies
CREATE POLICY "Users can view own keys" ON user_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keys" ON user_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audio assets policies
CREATE POLICY "Users can view own audio" ON audio_assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio" ON audio_assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio" ON audio_assets
    FOR DELETE USING (auth.uid() = user_id);

-- Entries policies
CREATE POLICY "Users can view own entries" ON entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON entries
    FOR DELETE USING (auth.uid() = user_id);

-- Entry embeddings policies
CREATE POLICY "Users can view own embeddings" ON entry_embeddings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM entries
            WHERE entries.id = entry_embeddings.entry_id
            AND entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own embeddings" ON entry_embeddings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM entries
            WHERE entries.id = entry_embeddings.entry_id
            AND entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own embeddings" ON entry_embeddings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM entries
            WHERE entries.id = entry_embeddings.entry_id
            AND entries.user_id = auth.uid()
        )
    );

-- Tags policies
CREATE POLICY "Users can view own tags" ON tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags" ON tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON tags
    FOR DELETE USING (auth.uid() = user_id);

-- Entry tags policies
CREATE POLICY "Users can view own entry tags" ON entry_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM entries
            WHERE entries.id = entry_tags.entry_id
            AND entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own entry tags" ON entry_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM entries
            WHERE entries.id = entry_tags.entry_id
            AND entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own entry tags" ON entry_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM entries
            WHERE entries.id = entry_tags.entry_id
            AND entries.user_id = auth.uid()
        )
    );

-- Daily summaries policies
CREATE POLICY "Users can view own daily summaries" ON daily_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily summaries" ON daily_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily summaries" ON daily_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily summaries" ON daily_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- Weekly summaries policies
CREATE POLICY "Users can view own weekly summaries" ON weekly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly summaries" ON weekly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly summaries" ON weekly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly summaries" ON weekly_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- Monthly summaries policies
CREATE POLICY "Users can view own monthly summaries" ON monthly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly summaries" ON monthly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly summaries" ON monthly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly summaries" ON monthly_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to search entries by vector similarity
CREATE OR REPLACE FUNCTION search_entries_by_embedding(
    p_user_id UUID,
    p_query_embedding vector(1536),
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    entry_id UUID,
    occurred_at TIMESTAMPTZ,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id AS entry_id,
        e.occurred_at,
        1 - (ee.embedding <=> p_query_embedding) AS similarity
    FROM entries e
    INNER JOIN entry_embeddings ee ON ee.entry_id = e.id
    WHERE e.user_id = p_user_id
    ORDER BY ee.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$;

-- Function to get entries for a date range (for summaries)
CREATE OR REPLACE FUNCTION get_entries_for_period(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    entry_id UUID,
    text_encrypted TEXT,
    text_iv TEXT,
    text_auth_tag TEXT,
    occurred_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id AS entry_id,
        e.text_encrypted,
        e.text_iv,
        e.text_auth_tag,
        e.occurred_at
    FROM entries e
    WHERE e.user_id = p_user_id
    AND e.occurred_at >= p_start_date
    AND e.occurred_at < p_end_date
    ORDER BY e.occurred_at ASC;
END;
$$;

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_entries_updated_at
    BEFORE UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_daily_summaries_updated_at
    BEFORE UPDATE ON daily_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_weekly_summaries_updated_at
    BEFORE UPDATE ON weekly_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_monthly_summaries_updated_at
    BEFORE UPDATE ON monthly_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Note: Run this in Supabase Dashboard or via API
-- Creates the private storage bucket for audio files

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('journal-audio', 'journal-audio', false);

-- Storage policies (apply via Supabase Dashboard)
-- Policy: Users can upload to their own folder
-- CREATE POLICY "Users can upload own audio" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'journal-audio' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Policy: Users can read their own audio
-- CREATE POLICY "Users can read own audio" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'journal-audio' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Policy: Users can delete their own audio
-- CREATE POLICY "Users can delete own audio" ON storage.objects
--     FOR DELETE USING (
--         bucket_id = 'journal-audio' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );
