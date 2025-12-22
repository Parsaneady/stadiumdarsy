-- Add storage policies for pension-exams bucket
-- Allow leaders to upload exam files
CREATE POLICY "Leaders can upload pension exam files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pension-exams' 
  AND EXISTS (
    SELECT 1 FROM pensions 
    WHERE pensions.leader_id = auth.uid() 
    AND pensions.id::text = (storage.foldername(name))[1]
  )
);

-- Allow leaders to update their pension exam files
CREATE POLICY "Leaders can update pension exam files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'pension-exams' 
  AND EXISTS (
    SELECT 1 FROM pensions 
    WHERE pensions.leader_id = auth.uid() 
    AND pensions.id::text = (storage.foldername(name))[1]
  )
);

-- Allow leaders to delete pension exam files
CREATE POLICY "Leaders can delete pension exam files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pension-exams' 
  AND EXISTS (
    SELECT 1 FROM pensions 
    WHERE pensions.leader_id = auth.uid() 
    AND pensions.id::text = (storage.foldername(name))[1]
  )
);

-- Allow all authenticated users to view pension exam files (for taking exams)
CREATE POLICY "Authenticated users can view pension exam files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pension-exams' 
  AND auth.role() = 'authenticated'
);