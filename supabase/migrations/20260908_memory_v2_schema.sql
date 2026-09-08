-- Memory 2.0: Enhanced schema with importance, confidence, status

-- Fix: Add ON DELETE SET NULL to source_message_id
ALTER TABLE memory_facts
  DROP CONSTRAINT IF EXISTS memory_facts_source_message_id_fkey;

ALTER TABLE memory_facts
  ADD CONSTRAINT memory_facts_source_message_id_fkey
  FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Add all new columns
ALTER TABLE memory_facts
  ADD COLUMN IF NOT EXISTS importance smallint DEFAULT 50,
  ADD COLUMN IF NOT EXISTS confidence smallint DEFAULT 80,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS superseded_by uuid REFERENCES memory_facts(id) ON DELETE SET NULL;

-- Constraints
DO $$ BEGIN
  ALTER TABLE memory_facts ADD CONSTRAINT importance_range CHECK (importance >= 0 AND importance <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE memory_facts ADD CONSTRAINT confidence_range CHECK (confidence >= 0 AND confidence <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE memory_facts ADD CONSTRAINT status_values CHECK (status IN ('active', 'archived', 'superseded'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memory_facts_user_status ON memory_facts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memory_facts_user_category ON memory_facts(user_id, category);
CREATE INDEX IF NOT EXISTS idx_memory_facts_importance ON memory_facts(importance DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_memory_facts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS memory_facts_updated_at ON memory_facts;
CREATE TRIGGER memory_facts_updated_at
  BEFORE UPDATE ON memory_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_facts_updated_at();

-- Backfill
UPDATE memory_facts SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE memory_facts SET status = 'active' WHERE status IS NULL;