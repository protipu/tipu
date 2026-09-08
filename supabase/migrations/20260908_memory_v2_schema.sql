-- Memory 2.0: Enhanced schema with importance, confidence, status, and deduplication

-- Add new columns to memory_facts
ALTER TABLE memory_facts
  ADD COLUMN IF NOT EXISTS importance smallint DEFAULT 50,
  ADD COLUMN IF NOT EXISTS confidence smallint DEFAULT 80,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS superseded_by uuid REFERENCES memory_facts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_slug text DEFAULT 'general';

-- Rename 'category' text to 'category_slug' for consistency
-- (existing data preserved via UPDATE)
UPDATE memory_facts SET category_slug = COALESCE(category, 'general');
ALTER TABLE memory_facts
  DROP COLUMN IF EXISTS category;

ALTER TABLE memory_facts
  RENAME COLUMN category_slug TO category;

-- Add constraint: importance and confidence must be 0-100
ALTER TABLE memory_facts
  ADD CONSTRAINT importance_range CHECK (importance >= 0 AND importance <= 100),
  ADD CONSTRAINT confidence_range CHECK (confidence >= 0 AND confidence <= 100);

-- Add constraint: status must be one of the allowed values
ALTER TABLE memory_facts
  ADD CONSTRAINT status_values CHECK (status IN ('active', 'archived', 'superseded'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_memory_facts_user_status ON memory_facts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memory_facts_user_category ON memory_facts(user_id, category);
CREATE INDEX IF NOT EXISTS idx_memory_facts_importance ON memory_facts(importance DESC);

-- Auto-update updated_at on changes
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

-- Backfill updated_at for existing rows
UPDATE memory_facts SET updated_at = created_at WHERE updated_at IS NULL;