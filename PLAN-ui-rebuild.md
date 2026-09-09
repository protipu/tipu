# Tipu Rebuild — Implementation Plan

## Context

Tipu is a personal AI companion web app (React + Vite + Supabase + Groq). The task has 4 parts: clean up Gemini references (none exist — already Groq-only), add markdown rendering, build the real UI from a dark-void + gold cinematic mockup, and fix the AI's system prompt to stop recapping on every message.

## Current State

- **Edge Function** (`supabase/functions/chat/index.ts`): Single function, already uses Groq `groq/compound`. No Gemini code anywhere. System prompt is inline at line 130 — too permissive, AI recaps everything.
- **Theme**: Dark indigo (`#0F172A` bg, `#6366F1` primary) with glass morphism, 3D effects, animated orbs.
- **No markdown rendering**: AI replies show raw `**bold**`, `| table |` as literal text.
- **Components**: App.tsx, Chat.tsx (3 tabs inline), Login.tsx, MessageBubble.tsx, MessageInput.tsx, MessageList.tsx, MemoryPage.tsx, MemoryCard.tsx, ErrorBoundary.tsx.
- **Dependencies**: react 19, @supabase/supabase-js, @capacitor. No markdown libs.

## Mockup Design (tipu-app-full.html)

- **Colors**: `--void:#0A0D16`, `--surface:#131829`, `--gold:#C9A24B`, `--gold-soft:#E8CE8C`, `--hairline:rgba(201,162,75,0.16)`
- **Fonts**: Fraunces (serif headings), Inter (body)
- **Chat**: Gold-tinted user bubbles (right), Tipu avatar ring (left), ledger tables, suggestion chips, rounded input bar
- **Memory**: Grouped cards (Profile/Finances/Habits), gold group titles, search bar
- **Settings**: Profile row, preference toggles, memory/data actions, account section
- **Nav**: Gold active dot indicator

---

## Execution Plan (13 Steps)

### Step 1: Save mockup
- **File**: `design/tipu-app-full.html` (new)
- Create `design/` directory, save the HTML mockup as reference

### Step 2: Install dependencies
- **Command**: `npm install react-markdown remark-gfm`
- Verify React 19 peer dep compatibility

### Step 3: Update Edge Function
- **File**: `supabase/functions/chat/index.ts`
- **3a** — Add 429 rate limit handling: return `{ error: 'Tipu is busy. Try again in a moment!', rateLimited: true }` with status 429
- **3b** — Read language preference from `memory_facts` where `category='preference'` and `fact ILIKE '%language%'`
- **3c** — Rewrite system prompt: concise by default (2-3 sentences), no recapping, structure only for tabular data, pass language instruction, match user's tone

### Step 4: Theme overhaul → gold cinematic
- **Files**: `src/styles/globals.css`, `index.html`
- **4a** — Add Google Fonts (Fraunces + Inter) to `index.html`
- **4b** — Replace all CSS custom properties: `--void:#0A0D16`, `--surface:#131829`, `--gold:#C9A24B`, `--gold-soft:#E8CE8C`, `--hairline:rgba(201,162,75,0.16)`, fonts, gradients
- **4c** — Update glass utility borders to gold hairline
- **4d** — Add markdown CSS styles (`.markdown-content`)

### Step 5: Build Settings page + update nav
- **Files**: `src/pages/Settings.tsx` (new), `src/pages/Chat.tsx`
- **5a** — Extract settings from Chat.tsx into new Settings.tsx: profile row, preference toggles, memory/data actions, account section
- **5b** — Update Chat.tsx to import Settings component for settings tab
- **5c** — Bottom nav: gold active dot instead of sliding bar

### Step 6: Markdown rendering in MessageBubble
- **File**: `src/components/chat/MessageBubble.tsx`
- Import `ReactMarkdown` + `remarkGfm`
- Wrap assistant content in `<ReactMarkdown>` (user messages stay plain text)
- Ledger-style table CSS for spending breakdowns

### Step 7: Update Login page for gold theme
- **File**: `src/pages/Login.tsx`
- Update FloatingOrbs colors from indigo/purple to gold tones
- Auto-adapts via CSS variable changes

### Step 8: Update Memory page for gold theme
- **Files**: `src/components/memory/MemoryPage.tsx`, `src/components/memory/MemoryCard.tsx`
- Add search bar UI (visual only)
- Auto-adapts via CSS variable changes for most styling

### Step 9: Frontend 429 handling
- **File**: `src/pages/Chat.tsx`
- Detect 429 in sendMessage catch block, show friendly message instead of raw error

### Step 10: Lint + typecheck
- `npx tsc --noEmit`, `npm run lint`

### Step 11: Run tests
- `npm run test` — 13 existing tests. MessageBubble tests may need selector updates for markdown rendering.

### Step 12: Update README
- Add react-markdown to tech stack, update theme description, add Phase 5 row, update UI/UX section

### Step 13: Git commit + push
- Single commit with all changes, push to main for Vercel auto-deploy

---

## Dependency Graph

```
Step 1 (mockup) ──────────────────────────────────────┐
Step 2 (install deps) ──┬── Step 4 (theme) ──┬── Step 5 (Settings)
                        │                    ├── Step 6 (markdown)
                        │                    ├── Step 7 (Login)
                        │                    └── Step 8 (Memory)
                        ├── Step 3 (Edge Fn) ── Step 9 (429 frontend)
                        └── Steps 10-13 (verify + push)
```

## Verification

After all steps:
1. Open app → gold cinematic UI, Fraunces headings, Inter body
2. Send expense message → Groq reply renders with markdown tables
3. Ask follow-up → short concise reply, no recap
4. Switch tabs → Memory shows grouped cards with search bar, Settings shows profile/preferences/data sections
5. All 13 tests pass, TypeScript clean, build succeeds
6. Push to main → Vercel auto-deploys
