-- Drop existing problematic policies
DROP POLICY IF EXISTS "Leaders can upload exam PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Leaders can upload exam files" ON storage.objects;
DROP POLICY IF EXISTS "Leaders can delete exam PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Leaders can delete exam files" ON storage.objects;
DROP POLICY IF EXISTS "Leaders can view their exam PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Pension members can view exam PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Pension members can view exam files" ON storage.objects;

-- Create correct upload policy for pension leaders
CREATE POLICY "pension_exam_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pension-exams' AND
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id::text = (storage.foldername(name))[1]
    AND pensions.leader_id = auth.uid()
  )
);

-- Create correct view policy for pension members
CREATE POLICY "pension_exam_view"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pension-exams' AND
  (
    EXISTS (
      SELECT 1 FROM pension_members
      WHERE pension_members.pension_id::text = (storage.foldername(name))[1]
      AND pension_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM pensions
      WHERE pensions.id::text = (storage.foldername(name))[1]
      AND pensions.leader_id = auth.uid()
    )
  )
);

-- Create correct delete policy for pension leaders
CREATE POLICY "pension_exam_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pension-exams' AND
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id::text = (storage.foldername(name))[1]
    AND pensions.leader_id = auth.uid()
  )
);