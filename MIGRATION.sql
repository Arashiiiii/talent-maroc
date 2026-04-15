-- ============================================================
-- TalentMaroc — Database Migration
-- Run these in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- 1. Add candidate info columns to the applications table
--    These are populated automatically when a candidate applies.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS candidate_email TEXT,
  ADD COLUMN IF NOT EXISTS candidate_name  TEXT,
  ADD COLUMN IF NOT EXISTS cv_url          TEXT,
  ADD COLUMN IF NOT EXISTS cover_letter    TEXT;


-- 2. Create the 'cvs' storage bucket for candidate CV uploads
--    Run in Supabase Dashboard → Storage → New Bucket,
--    OR execute via SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;


-- 3. Storage RLS policies for the 'cvs' bucket
--    Candidates can upload their own CV; anyone can read (public bucket).

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Candidates can upload their CV"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow the owner to update/delete their CV
CREATE POLICY "Candidates can update their own CV"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Candidates can delete their own CV"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read (CVs are shared with employers when applying)
CREATE POLICY "Public can read CVs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cvs');


-- 4. (Optional) Index for faster employer queries on new columns
CREATE INDEX IF NOT EXISTS idx_applications_candidate_email
  ON applications (candidate_email);


-- ============================================================
-- After running this migration:
-- • Candidates can upload a PDF CV from their dashboard
-- • CV URL is auto-attached to new applications
-- • Employers see candidate name + email + CV link in dashboard
-- • AI comparison uses these fields for better analysis
-- ============================================================
