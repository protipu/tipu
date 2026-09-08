# Tipu

A personal AI companion web app — a virtual version of me (Ragib), without the emotions and bad habits.

## Overview

Tipu is a single-user chat interface that:
- Converses naturally like a friend
- Quietly extracts and stores long-term facts about the user's life
- Uses stored context to give increasingly personal, relevant replies over time
- Remembers with categories, importance levels, and confidence scores
- Deduplicates and supersedes outdated memories automatically

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (blue/white modern theme with robot mascot)
- **State**: React Context + built-in hooks only
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **AI**: Groq API (`groq/compound` model) via Supabase Edge Functions
- **Hosting**: Vercel (auto-deploy on push to `main`)
- **Testing**: Vitest + React Testing Library
- **Mobile**: Capacitor (Android APK)
- **Linting**: oxlint (fast Rust-based linter)

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

-- memory_facts: enhanced long-term memory (Memory 2.0)
create table memory_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  fact text not null,
  category text default 'general',       -- personal, preference, work, people, etc.
  importance smallint default 50,         -- 1-100: how important to know
  confidence smallint default 80,         -- 1-100: how sure is the AI
  status text default 'active' check (status in ('active', 'archived', 'superseded')),
  source_message_id uuid references messages(id) on delete set null,
  superseded_by uuid references memory_facts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (importance >= 0 and importance <= 100),
  check (confidence >= 0 and confidence <= 100)
);

-- Indexes for performance
create index idx_memory_facts_user_status on memory_facts(user_id, status);
create index idx_memory_facts_user_category on memory_facts(user_id, category);
create index idx_memory_facts_importance on memory_facts(importance desc);
```

## Build Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ | Vite + React + TS + Tailwind scaffold, Vercel config |
| 1 | ✅ | Supabase email/password auth, login screen, session persistence, logout |
| 2 | ✅ | Core chat loop (UI + Edge Function → Groq API, error/timeout/retry handling) |
| 3 | ✅ | Persist messages, load conversation history on reload |
| 4 | ✅ | Long-term memory (fact extraction + recall in system prompt) |
| 5 | ✅ | UI polish — blue/white modern theme with robot mascot |
| 6 | ✅ | Capacitor Android APK |
| 7 | ✅ | Security hardening, UX improvements, testing, CI/CD |
| Phase 2 | ✅ | Foundation fixes — delete, CORS, timestamps, pagination, dead code |
| Phase 3 | ✅ | **Memory 2.0** — enhanced memory with categories, importance, confidence, dedup |

## What's Implemented

### Memory 2.0
- **10 categories**: Personal, Preference, Work, People, Relationship, Goal, Project, Event, Habit, Health
- **Importance scoring**: 1-100 scale, memories sorted by importance
- **Confidence scoring**: 1-100 scale, low-confidence facts skipped
- **Status system**: Active, Archived, Superseded
- **Deduplication**: Similar memories detected and merged
- **Superseding**: Outdated memories replaced with updated versions
- **Memory UI**: Full-featured memory page with category filters, edit, delete, archive
- **Auto-extraction**: AI extracts 0-3 facts per conversation turn
- **Rich system prompt**: AI receives top memories by importance with category context

### Security
- CORS restricted to `tipu.vercel.app` + localhost (explicit allowlist)
- Environment variable validation at Edge Function startup
- Service role key with manual JWT verification
- Input validation (max 4000 chars per message)
- Edge Function uses `Deno.serve()` (compatible with latest Supabase Edge Runtime)

### UX Improvements
- **Typing indicator**: Animated dots while assistant responds
- **Message timestamps**: Each message shows time
- **Delete messages**: Hover to reveal delete button
- **Message history**: Load older messages with pagination
- **Loading skeleton**: Skeleton placeholders while history loads
- **Error boundary**: Graceful error handling with retry/reload options
- **Memory page**: Browse, filter, edit, delete, archive memories
- **Category filters**: Quick filter by memory category with counts

### Code Quality
- **TypeScript strict mode**: Full type safety
- **13 unit tests**: ErrorBoundary, MessageBubble, MessageInput components
- **Vitest**: Fast test runner with React Testing Library (automatic JSX runtime)

### DevOps
- **GitHub Actions**: Auto-deploy to Vercel on push to `main`
- **Edge Function deploy**: Separate workflow for Supabase functions
- **Keep-alive**: Pings Supabase every 6 hours to prevent free-tier pause

### UI/UX
- **Blue/white modern theme**: Clean, professional design
- **Robot mascot**: Custom SVG mascot (`public/mascot.svg`)
- **Bottom navigation**: Message, Memory, Settings tabs
- **PWA manifest**: Installable as Progressive Web App
- **Open Graph tags**: Social sharing previews

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

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint
```

## Deployment

- **Vercel**: Auto-deploys on push to `main` via GitHub Actions (`.github/workflows/deploy.yml`)
- **Edge Functions**: Deploy via GitHub Actions (`.github/workflows/deploy-functions.yml`)
- **Environment variables** (set in Vercel dashboard):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Edge Function secrets** (set in Supabase dashboard):
  - `GROQ_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_URL`

## Android APK Build

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio (for building APK)
npx cap open android

# Or build APK from command line (requires Android SDK)
cd android && ./gradlew assembleDebug
# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```

## Security

- Groq API key **never** reaches the browser — all AI calls happen server-side in Supabase Edge Functions
- CORS restricted to explicit allowlist only
- Environment variables validated at startup
- No runtime settings screen for API keys — credentials baked in at deploy time
- Row Level Security ensures users only access their own data
- Foreign key cascade protection on memory deletions

## License

Private / Personal use.