-- ============================================================
-- TalentMaroc — Add international support (country column)
-- Run in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS country TEXT;

-- Backfill existing jobs (all posted before this feature) as Morocco
UPDATE jobs SET country = 'Maroc' WHERE country IS NULL;

ALTER TABLE jobs ALTER COLUMN country SET DEFAULT 'Maroc';

CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs (country);
