-- messages: full conversation history
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- memory_facts: extracted long-term facts about the user
create table if not exists memory_facts (
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

-- Policies
create policy "Users can access own messages" on messages
  for all using (auth.uid() = user_id);

create policy "Users can access own memory facts" on memory_facts
  for all using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists messages_user_id_created_at_idx on messages (user_id, created_at);
create index if not exists memory_facts_user_id_idx on memory_facts (user_id);