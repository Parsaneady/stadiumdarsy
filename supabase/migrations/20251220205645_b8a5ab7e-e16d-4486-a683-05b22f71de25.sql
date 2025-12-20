-- Create storage bucket for pension exam files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pension-exams', 'pension-exams', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Pension leaders can upload exam files
CREATE POLICY "Leaders can upload exam files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pension-exams' AND
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.leader_id = auth.uid()
    AND pensions.id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Pension members can view exam files
CREATE POLICY "Pension members can view exam files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pension-exams' AND
  (
    EXISTS (
      SELECT 1 FROM pension_members
      WHERE pension_members.user_id = auth.uid()
      AND pension_members.pension_id::text = (storage.foldername(name))[1]
    )
    OR
    EXISTS (
      SELECT 1 FROM pensions
      WHERE pensions.leader_id = auth.uid()
      AND pensions.id::text = (storage.foldername(name))[1]
    )
  )
);

-- Policy: Leaders can delete exam files
CREATE POLICY "Leaders can delete exam files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pension-exams' AND
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.leader_id = auth.uid()
    AND pensions.id::text = (storage.foldername(name))[1]
  )
);

-- Add columns to pension_exams for PDF and answer key
ALTER TABLE public.pension_exams 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS answer_key JSONB DEFAULT '{}'::jsonb;