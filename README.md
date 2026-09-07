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
- **AI**: Groq API (`groq/compound` model) via Supabase Edge Functions
- **Hosting**: Vercel (auto-deploy on push to `main`)

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Supabase Edge   │────▶│   Groq API  │
│   (React)   │     │  Function: chat  │     │   (Llama)   │
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
alter table messages enable row level security;
alter table memory_facts enable row level security;

create policy "Users can access own messages" on messages
  for all using (auth.uid() = user_id);

create policy "Users can access own memory facts" on memory_facts
  for all using (auth.uid() = user_id);

create index messages_user_id_created_at_idx on messages (user_id, created_at);
create index memory_facts_user_id_idx on memory_facts (user_id);
```

## Build Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ | Vite + React + TS + Tailwind scaffold, Vercel config |
| 1 | ✅ | Supabase email/password auth, login screen, session persistence, logout |
| 2 | ✅ | Core chat loop (UI + Edge Function → Groq API, error/timeout/retry handling) |
| 3 | ✅ | Persist messages, load conversation history on reload |
| 4 | 🔄 | Long-term memory (fact extraction + recall) |
| 5 | ⏳ | Polish: theme, responsive, empty/loading/error states |
| 6 | ⏳ | Capacitor Android APK (later) |

## What's Done (Phases 0-3)

- **Phase 0**: Scaffold, Vercel deployment pipeline, GitHub Actions CI/CD
- **Phase 1**: Supabase Auth with email/password, login/signup screen, session persistence, logout
- **Phase 2**: Chat UI (MessageList, MessageInput, MessageBubble), Supabase Edge Function with Groq API, 25s timeout, retry button on error, auth verification
- **Phase 3**: `messages` table with RLS, save user/assistant messages, load last 20 messages on page load, include history in Groq context

## What's Remaining

- **Phase 4 (current)**: Create `memory_facts` table, add fact-extraction step in Edge Function, inject facts into system prompt for personalized replies
- **Phase 5**: Mobile responsive polish, loading skeletons, better empty states, scroll behavior
- **Phase 6**: Capacitor wrapper for Android APK

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

- **Vercel**: Auto-deploys on push to `main` via GitHub Actions (`.github/workflows/deploy.yml`)
- **Environment variables** (set in Vercel dashboard):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Edge Function secrets** (set in Supabase dashboard):
  - `GROQ_API_KEY`

## Keep-Alive

GitHub Actions workflow (`.github/workflows/keepalive.yml`) pings Supabase every 6 hours to prevent free-tier auto-pause.

## Security

- Groq API key **never** reaches the browser — all AI calls happen server-side in Supabase Edge Functions
- No runtime settings screen for API keys — credentials baked in at deploy time
- Row Level Security ensures users only access their own data

## License

Private / Personal use.