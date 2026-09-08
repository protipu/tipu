# Tipu

A personal AI companion web app — a virtual version of me (Ragib), without the emotions and bad habits.

## Overview

Tipu is a single-user chat interface that:
- Converses naturally like a friend
- Quietly extracts and stores long-term facts about the user's life
- Uses stored context to give increasingly personal, relevant replies over time

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (warm cozy home-office theme)
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

## Theme Architecture

Theme is cleanly separated from component logic:
- `src/styles/theme.ts` — Single source of truth for design tokens (colors, fonts, shadows, gradients)
- `src/styles/globals.css` — `@theme` + explicit `:root` CSS variables for Tailwind mapping
- Components use Tailwind classes (`bg-primary`, `text-text`, `border-border-light`) — no hardcoded colors

To change the theme: edit `theme.ts` → update `globals.css` to match → no component changes needed.

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
| 4 | ✅ | Long-term memory (fact extraction + recall in system prompt) |
| 5 | ✅ | Polish: warm cozy theme, gradient backgrounds, glassmorphism, shadows, loading states |
| 6 | ✅ | Capacitor Android APK |
| 7 | ✅ | Security hardening, UX improvements, testing, CI/CD |

## What's Implemented

### Security
- CORS restricted to allowed origins (Vercel domains + localhost)
- Environment variable validation at Edge Function startup
- Service role key with manual JWT verification

### UX Improvements
- **Typing indicator**: Animated dots while assistant responds
- **Message timestamps**: Each message shows time (e.g., "2:30 PM")
- **Clear chat**: Trash icon in header to clear all messages
- **Message delete**: Hover over user messages to reveal delete button
- **Loading skeleton**: Skeleton placeholders while history loads
- **Error boundary**: Graceful error handling with retry/reload options

### Code Quality
- **TypeScript strict mode**: Full type safety
- **13 unit tests**: ErrorBoundary, MessageBubble, MessageInput components
- **Vitest**: Fast test runner with React Testing Library
- **Dead code removed**: Unused `SendMessageResult` type cleaned up

### DevOps
- **GitHub Actions**: Auto-deploy to Vercel on push to `main`
- **Edge Function deploy**: Separate workflow for Supabase functions
- **Keep-alive**: Pings Supabase every 6 hours to prevent free-tier pause

### UI/UX
- **PWA manifest**: Installable as Progressive Web App
- **Open Graph tags**: Social sharing previews
- **Warm favicon**: Gold gradient "T" matching the theme
- **Viewport fit**: Safe area support for notched devices

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

## Keep-Alive

GitHub Actions workflow (`.github/workflows/keepalive.yml`) pings Supabase every 6 hours to prevent free-tier auto-pause.

## Security

- Groq API key **never** reaches the browser — all AI calls happen server-side in Supabase Edge Functions
- CORS restricted to allowed origins only
- Environment variables validated at startup
- No runtime settings screen for API keys — credentials baked in at deploy time
- Row Level Security ensures users only access their own data

## License

Private / Personal use.