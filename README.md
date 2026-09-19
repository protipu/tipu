# Tipu

A personal AI companion web app — a warm, immersive workspace where your AI friend remembers everything about you.

## Overview

Tipu is a full-screen workspace experience that:
- Converses naturally like a close friend, with concise replies
- Quietly extracts and stores long-term facts about your life
- Uses stored context to give increasingly personal, relevant replies
- Remembers with categories, importance levels, and confidence scores
- Deduplicates and supersedes outdated memories automatically
- Lives inside a warm home office environment with ambient lighting

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (warm dark palette, Fraunces + Inter fonts)
- **Markdown**: react-markdown + remark-gfm for AI message rendering
- **State**: React Context + custom hooks
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **AI**: Groq API (`groq/compound` model) via Supabase Edge Functions
- **Hosting**: Vercel (auto-deploy on push to `main`)
- **Testing**: Vitest + React Testing Library
- **Mobile**: Capacitor (Android APK)
- **Linting**: oxlint (fast Rust-based linter)

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│   Browser   ├────▶│  Supabase Edge   ├────▶│   Groq API     │
│   (React)   │     │  Function: chat  │     │  - compound    │
└──────┬──────┘     └──────────────────┘     │  - llama-3.3-70b
       │                                      └────────────────
       │
       │        ┌──────────────────┐
       └───────▶│   Supabase DB    │
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

-- memory_facts: enhanced long-term memory
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

## Features

### Warm Workspace Environment
- **CSS home office scene**: Sky gradient, city skyline, window frame, bookshelf, desk surface, lamp glow
- **TipuCharacter**: Gold avatar with breathing animation and mood states (idle, thinking, happy, listening)
- **SceneBackground**: Layered CSS gradients creating depth without images
- **Glassmorphism**: Frosted glass effects on header and bottom nav
- **Bottom controls**: Message / Memory / Settings tab navigation

### Memory 2.0
- **11 categories**: Personal, Preference, Work, People, Relationship, Goal, Project, Event, Habit, Health, General
- **Importance scoring**: 1–100 scale, memories sorted by importance
- **Confidence scoring**: 1–100 scale, low-confidence facts skipped
- **Status system**: Active, Archived, Superseded
- **Deduplication**: >90% similar skipped, >60% same category superseded
- **Auto-extraction**: Groq Llama 3.3 70B extracts durable facts after each chat message
- **Relevance retrieval**: Keyword matching selects top 5 most relevant memories per message
- **Memory UI**: Category filters, search, edit, delete, archive, create via FAB + modal

### AI Response Quality
- **Concise replies**: System prompt enforces 1–3 sentence default
- **Markdown rendering**: Tables, bold, headings via react-markdown + remark-gfm
- **Language preference**: Reads Bengali/other language from memory_facts
- **429 rate limit handling**: Friendly "Tipu is busy" message
- **Dual-model architecture**: `groq/compound` for chat, `groq/llama-3.3-70b-versatile` for extraction

### Security
- CORS restricted to explicit allowlist
- Environment variable validation at Edge Function startup
- Service role key with manual JWT verification
- Input validation (max 4000 chars per message)

### UX
- **Typing indicator**: Animated dots while assistant responds
- **Message timestamps**: Each message shows time
- **Delete messages**: Hover to reveal delete button
- **Message history**: Load older messages with pagination
- **FocusView**: Full-screen reading mode for long AI responses
- **Error boundary**: Graceful error handling with retry/reload
- **Memory page**: Browse, filter, search, edit, delete, archive memories
- **Settings page**: Profile, preferences, memory/data actions, account

### Code Quality
- **TypeScript strict mode**: Full type safety
- **13 unit tests**: ErrorBoundary, MessageBubble, MessageInput
- **Custom hooks**: `useChat`, `useChatMemory`, `useFocusView`
- **Component architecture**: workspace/, chat/, memory/ separation

## Project Structure

```
src/
├── components/
│   ├── workspace/       # Workspace shell components
│   │   ├── SceneBackground.tsx   # CSS office environment
│   │   ├── TipuCharacter.tsx     # Gold avatar with animation
│   │   ├── WorkspaceHeader.tsx   # Glassmorphism header
│   │   ├── WorkspaceControls.tsx # Bottom nav (Message/Memory/Settings)
│   │   ├── FocusView.tsx         # Full-screen reading mode
│   │   └── index.ts
│   ├── chat/            # Chat components
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── MessageList.tsx
│   ├── memory/          # Memory components
│   │   ├── MemoryPage.tsx
│   │   └── MemoryCard.tsx
│   └── ErrorBoundary.tsx
├── hooks/               # Custom React hooks
│   ├── useChat.ts
│   ├── useChatMemory.ts
│   └── useFocusView.ts
├── pages/
│   ├── Chat.tsx         # Main workspace orchestrator
│   ├── Login.tsx
│   └── Settings.tsx
├── context/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
├── types/
│   ├── chat.ts
│   └── memory.ts
├── utils/
│   └── format.tsx       # Markdown renderer
├── styles/
│   └── globals.css      # Warm palette, animations, markdown
├── test/
│   ├── MessageBubble.test.tsx
│   ├── MessageInput.test.tsx
│   └── ErrorBoundary.test.tsx
├── App.tsx
└── main.tsx
```

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
- **Edge Functions**: Deploy via `npx supabase functions deploy chat`
- **Environment variables** (set in Vercel dashboard):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Edge Function secrets** (set in Supabase dashboard):
  - `GROQ_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_URL`

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
