# Tipu

A personal AI companion web app — a virtual version of me (Ragib), without the emotions and bad habits.

## Overview

Tipu is a single-user chat interface that:
- Converses naturally like a friend
- Quietly extracts and stores long-term facts about the user's life
- Uses stored context to give increasingly personal, relevant replies over time
- Remembers with categories, importance levels, and confidence scores
- Deduplicates and supersedes outdated memories automatically
- Renders AI replies with proper markdown (tables, bold, headings)

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (dark-void + gold cinematic theme, Fraunces + Inter fonts)
- **Markdown**: react-markdown + remark-gfm for AI message rendering
- **State**: React Context + built-in hooks only
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **AI**: Groq API (`groq/compound` model) via Supabase Edge Functions
- **Hosting**: Vercel (auto-deploy on push to `main`)
- **Testing**: Vitest + React Testing Library
- **Mobile**: Capacitor (Android APK)
- **Linting**: oxlint (fast Rust-based linter)

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Supabase Edge   │────▶│   Groq API      │
│   (React)   │     │  Function: chat  │     │  - compound     │
└─────────────┘     └──────────────────┘     │  - llama-3.3-70b│
       │                    │                └─────────────────┘
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
  category text default 'general',
  importance smallint default 50,
  confidence smallint default 80,
  status text default 'active' check (status in ('active', 'archived', 'superseded')),
  source_message_id uuid references messages(id) on delete set null,
  superseded_by uuid references memory_facts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (importance >= 0 and importance <= 100),
  check (confidence >= 0 and confidence <= 100)
);

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
| 5 | ✅ | UI polish — blue/white modern theme |
| 6 | ✅ | Capacitor Android APK |
| 7 | ✅ | Security hardening, UX improvements, testing, CI/CD |
| Phase 2 | ✅ | Foundation fixes — delete, CORS, timestamps, pagination, dead code |
| Phase 3 | ✅ | **Memory 2.0** — enhanced memory with categories, importance, confidence, dedup |
| Phase 4 | ✅ | **UI Redesign** — dark companion theme, glass morphism, 3D card effects |
| Phase 5 | ✅ | **Gold Cinematic UI** — dark-void theme, Fraunces/Inter fonts, ledger tables, markdown rendering |
| Phase A | ✅ | Fix MemoryPage — send `?section=memories` to Edge Function GET handler |
| Phase B | ✅ | Fix chat pagination — send `offset`/`limit` params, load more button |
| Phase C | ✅ | Fix MemoryPage/MemoryCard — replace broken CSS classes with inline hex values |
| Phase D | ✅ | **Memory extraction** — Groq Llama extracts durable facts after each chat message |
| Phase E | ✅ | **Deduplication** — skip >90% similar, supersede >60% same category |
| Phase F | ✅ | **Relevance retrieval** — keyword matching selects top 5 memories per message |
| Phase G | ✅ | **Memory creation UI** — FAB button, create modal with category/importance |
| Phase H | ✅ | Align Login/Settings with flat theme — inline hex values |

## What's Implemented

### Memory 2.0
- **11 categories**: Personal, Preference, Work, People, Relationship, Goal, Project, Event, Habit, Health, General
- **Importance scoring**: 1-100 scale, memories sorted by importance
- **Confidence scoring**: 1-100 scale, low-confidence facts skipped
- **Status system**: Active, Archived, Superseded
- **Deduplication**: >90% similar memories skipped, >60% same category superseded
- **Superseding**: Outdated memories replaced with updated versions
- **Memory UI**: Full-featured memory page with category filters, search bar, edit, delete, archive, create
- **Auto-extraction**: Groq Llama 3.3 70B extracts durable facts after each chat message
- **Relevance retrieval**: Keyword matching selects top 5 most relevant memories per message
- **Create memories manually**: FAB button with category selector and importance slider

### AI Response Quality
- **Concise replies**: System prompt enforces 1-3 sentence default
- **No unnecessary recapping**: AI doesn't restate conversation history on every message
- **Markdown rendering**: Tables, bold, headings rendered properly via react-markdown + remark-gfm
- **Ledger-style tables**: Spending breakdowns display as clean tabular data
- **Language preference**: Reads Bengali/other language preference from memory_facts and passes to Groq
- **429 rate limit handling**: Friendly "Tipu is busy" message instead of raw error
- **Dual-model architecture**: `groq/compound` for chat, `groq/llama-3.3-70b-versatile` for memory extraction

### Security
- CORS restricted to `tipu.vercel.app` + `tipu-pearl.vercel.app` + `tipu.mithebangla.store` + localhost
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
- **Memory page**: Browse, filter, search, edit, delete, archive memories
- **Settings page**: Profile, preferences (language, dark theme, check-in reminder), memory/data actions, account

### Code Quality
- **TypeScript strict mode**: Full type safety
- **13 unit tests**: ErrorBoundary, MessageBubble, MessageInput components
- **Vitest**: Fast test runner with React Testing Library (automatic JSX runtime)

### DevOps
- **GitHub Actions**: Auto-deploy to Vercel on push to `main`
- **Edge Function deploy**: Separate workflow for Supabase functions

### UI/UX
- **Dark-void + gold cinematic theme**: `#0A0D16` background, `#C9A24B` gold accents
- **Typography**: Fraunces (serif) for headings, Inter (sans-serif) for body text
- **Gold-tinted user bubbles**: Right-aligned with subtle gold background
- **Tipu avatar ring**: Radial gradient gold circle with "T" initial
- **Ledger-style tables**: Clean tabular data display for spending breakdowns
- **Glass morphism**: Frosted glass effects on headers, nav, cards, and input bars
- **3D card effects**: Interactive tilt on hover for message bubbles and memory cards
- **Animated orbs**: Floating background orbs with slow drift animations
- **Smooth animations**: Entrance slide-ups, scale-ins, fade-ins, wave typing indicator
- **Bottom navigation**: Chat, Memory, Settings tabs with gold active dot indicator
- **Suggestion chips**: Quick-reply suggestions on empty chat
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

- **Vercel**: Auto-deploys on push to `main` via GitHub Actions
- **Edge Functions**: Deploy via GitHub Actions or `npx supabase functions deploy chat`
- **Environment variables** (set in Vercel dashboard):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Edge Function secrets** (set in Supabase dashboard):
  - `GROQ_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_URL`

## Design Reference

The full static mockup is at `design/tipu-app-full.html` — a self-contained HTML file with all CSS inline, showing the Chat, Memory, and Settings screens with the gold cinematic theme.

## Android APK Build

```bash
npm run build
npx cap sync android
npx cap open android
# Or: cd android && ./gradlew assembleDebug
```

## Security

- Groq API key **never** reaches the browser — all AI calls happen server-side
- CORS restricted to explicit allowlist only
- Environment variables validated at startup
- Row Level Security ensures users only access their own data
- Foreign key cascade protection on memory deletions

## License

Private / Personal use.
