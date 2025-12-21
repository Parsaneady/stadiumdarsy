-- Drop existing policies and recreate with simpler logic
DROP POLICY IF EXISTS "pension_exam_upload" ON storage.objects;
DROP POLICY IF EXISTS "pension_exam_view" ON storage.objects;
DROP POLICY IF EXISTS "pension_exam_delete" ON storage.objects;

-- Simpler upload policy: Leaders can upload to their pension folder
CREATE POLICY "pension_exam_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pension-exams' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM pensions WHERE leader_id = auth.uid()
  )
);

-- Simpler view policy: Members and leaders can view files
CREATE POLICY "pension_exam_view"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pension-exams' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT pension_id::text FROM pension_members WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM pensions WHERE leader_id = auth.uid()
    )
  )
);

-- Simpler delete policy: Leaders can delete from their pension folder
CREATE POLICY "pension_exam_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pension-exams' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM pensions WHERE leader_id = auth.uid()
  )
);