# Tipu

A personal AI companion web app — a virtual version of me (Ragib), without the emotions and bad habits.

## Overview

Tipu is a single-user chat interface that:
- Converses naturally like a friend
- Quietly extracts and stores long-term facts about the user's life
- Uses stored context to give increasingly personal, relevant replies over time

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 (white/bluish minimalist theme)
- **State**: React Context + built-in hooks only
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **AI**: Google Gemini API (server-side only via Supabase Edge Functions)
- **Hosting**: Cloudflare Pages (auto-deploy on push to `master`)

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Supabase Edge   │────▶│   Gemini    │
│   (React)   │     │  Function: chat  │     │   API       │
└─────────────┘     └──────────────────┘     └─────────────┘
       │                    │
       │                    ▼
       │            ┌──────────────────┐
       └───────────▶│   Supabase DB    │
                    │  - messages      │
                    │  - memory_facts  │
                    └──────────────────┘
```

## Database Schema

```sql
-- messages: full conversation history
create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- memory_facts: extracted long-term facts about the user
create table memory_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  fact text not null,
  category text, -- e.g. 'work', 'health', 'people', 'preference', 'event'
  source_message_id uuid references messages(id),
  created_at timestamptz not null default now()
);

-- Row Level Security on both tables
```

## Build Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ | Vite + React + TS + Tailwind scaffold, Cloudflare Pages config |
| 1 | 🔄 | Supabase email/password auth, login screen, session persistence |
| 2 | ⏳ | Core chat loop (UI + Edge Function, no memory/persistence) |
| 3 | ⏳ | Persist messages, load conversation history on reload |
| 4 | ⏳ | Long-term memory (fact extraction + recall) |
| 5 | ⏳ | Polish: theme, responsive, empty/loading/error states |
| 6 | ⏳ | Capacitor Android APK (later) |

## Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Deployment

- **Cloudflare Pages**: Auto-deploys on push to `master` via GitHub Actions (`.github/workflows/deploy.yml`)
- **Environment variables** (set in Cloudflare Pages dashboard):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Edge Function secrets** (set in Supabase dashboard):
  - `GEMINI_API_KEY`

## Keep-Alive

GitHub Actions workflow (`.github/workflows/keepalive.yml`) pings Supabase every 6 hours to prevent free-tier auto-pause.

## Security

- Gemini API key **never** reaches the browser — all AI calls happen server-side in Supabase Edge Functions
- No runtime settings screen for API keys — credentials baked in at deploy time
- Row Level Security ensures users only access their own data

## License

Private / Personal use.