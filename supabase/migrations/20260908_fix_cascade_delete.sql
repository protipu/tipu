-- Fix: Add ON DELETE CASCADE to memory_facts.source_message_id
-- This allows deleting messages without FK violations

ALTER TABLE memory_facts
  DROP CONSTRAINT IF EXISTS memory_facts_source_message_id_fkey;

ALTER TABLE memory_facts
  ADD CONSTRAINT memory_facts_source_message_id_fkey
  FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL;