# Recall - Speech-First Journal

> Speak your thoughts. Recall your life.

Recall is a privacy-focused voice journal that transforms your spoken thoughts into a searchable, organized timeline with AI-powered insights and summaries.

## Features

- **Voice-First Recording** - Press and hold to record, or tap to toggle. Audio is transcribed instantly.
- **End-to-End Encryption** - All journal entries are encrypted before storage. We can't read your journal.
- **Semantic Search** - Find entries by meaning, not just keywords.
- **AI Analysis** - Automatic sentiment detection, mood tracking, and smart tagging.
- **Daily/Weekly/Monthly Summaries** - AI-generated insights about your patterns and progress.
- **PWA Support** - Install on any device for a native app experience.
- **Data Export** - Download your complete journal as Markdown/JSON anytime.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + pgvector)
- **Auth**: Supabase Auth (Magic Link + OAuth)
- **AI**: OpenAI (Whisper, GPT-4.1-mini, text-embedding-3-small)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase project
- An OpenAI API key
- A Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/recall.git
cd recall
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the SQL migration in the Supabase SQL Editor:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor and run

3. Create a storage bucket:
   - Go to Storage in Supabase Dashboard
   - Create a new bucket named `journal-audio`
   - Set it to **Private**
   - Add the storage policies from the comments at the bottom of the migration file

4. Configure Authentication:
   - Go to Authentication > Providers
   - Enable Email (Magic Link)
   - Optionally enable Google and/or GitHub OAuth
   - Set the Site URL to your app URL

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
# Supabase (from Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_MASTER_KEY=your-32-byte-base64-key

# Cron Jobs (generate with: openssl rand -hex 32)
CRON_SECRET=your-cron-secret
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket

2. Import the project in Vercel

3. Add environment variables in Vercel Dashboard:
   - All variables from `.env.example`
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL

4. Deploy!

### Configure Cron Jobs

The `vercel.json` file already includes cron job configurations:

- `/api/cron/daily` - Runs at 5:00 AM UTC daily
- `/api/cron/weekly` - Runs at 6:00 AM UTC every Monday
- `/api/cron/monthly` - Runs at 7:00 AM UTC on the 1st of each month

Vercel will automatically set up these cron jobs on deploy.

### Generate PWA Icons

See `scripts/generate-icons.md` for instructions on generating the required PWA icons from the SVG source.

## Architecture

### Database Schema

```
profiles          - User settings and preferences
user_keys         - Wrapped encryption keys per user
audio_assets      - Audio file metadata
entries           - Encrypted journal entries
entry_embeddings  - Vector embeddings for semantic search
tags              - User-specific tags
entry_tags        - Entry-tag relationships
daily_summaries   - AI-generated daily summaries
weekly_summaries  - AI-generated weekly summaries
monthly_summaries - AI-generated monthly summaries
```

### Encryption Model

1. **Master Key**: A 32-byte AES key stored as an environment variable
2. **User Data Keys**: Each user has a unique 32-byte key, encrypted (wrapped) with the master key
3. **Transcript Encryption**: Journal text is encrypted with the user's data key using AES-256-GCM
4. **Decryption**: Only happens server-side within an authenticated user session

```
User Data → AES-256-GCM (User Key) → Encrypted Storage
User Key → AES-256-GCM (Master Key) → Wrapped Key Storage
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/entries/ingest` | POST | Upload and process new entry |
| `/api/entries/embed` | POST | Generate embedding for entry |
| `/api/entries/list` | GET | Paginated entry list |
| `/api/entries/[id]` | GET/DELETE | Get or delete single entry |
| `/api/search/semantic` | POST | Semantic search |
| `/api/summaries/generate` | POST | Generate summary |
| `/api/summaries/list` | GET | List summaries |
| `/api/export/month` | POST | Export month as ZIP |
| `/api/cron/daily` | POST | Daily summary cron |
| `/api/cron/weekly` | POST | Weekly summary cron |
| `/api/cron/monthly` | POST | Monthly summary cron |

## Security

### What We Protect Against

- **Database compromise**: All journal content is encrypted at rest
- **Admin access**: No admin tools to view decrypted content
- **Cross-user access**: Row Level Security (RLS) on all tables
- **Session hijacking**: Supabase handles session security

### Third-Party Data Handling

- **OpenAI**: Processes audio and text for transcription/analysis. Per their API policy, data is not used for training and is retained max 30 days for abuse monitoring.
- **Supabase**: Hosts encrypted data. Has no access to decryption keys.
- **Vercel**: Processes requests. No persistent access to user data.

## Key Rotation

To rotate the master encryption key:

1. Generate a new key: `openssl rand -base64 32`
2. Run the re-wrap script (see `lib/crypto.ts` for `reWrapDataKey` function)
3. Update the `ENCRYPTION_MASTER_KEY` environment variable
4. Redeploy

## Cost Estimates

Per user (moderate usage: 5 entries/day, avg 2 min each):

| Service | Monthly Cost |
|---------|-------------|
| OpenAI Whisper | ~$2-3 |
| OpenAI GPT-4.1-mini | ~$0.50 |
| OpenAI Embeddings | ~$0.10 |
| Supabase (Free tier) | $0 |
| Vercel (Free tier) | $0 |

**Total**: ~$3-4/user/month at moderate usage

## Development

### Project Structure

```
/app                  # Next.js App Router pages
  /api                # API route handlers
  /app                # Authenticated app pages
  /(public)           # Public pages (landing, auth)
/components           # React components
  /ui                 # Base UI components (shadcn/ui style)
/lib                  # Utilities
  /supabase           # Supabase clients
  crypto.ts           # Encryption utilities
  openai.ts           # OpenAI helpers
  utils.ts            # General utilities
/types                # TypeScript types
/supabase             # Database migrations
/public               # Static assets
```

### Running Tests

```bash
npm run test
```

### Type Checking

```bash
npm run lint
```

## License

MIT

## Support

For issues and feature requests, please open a GitHub issue.
