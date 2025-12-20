-- Allow pension leaders to view their exam PDFs
CREATE POLICY "Leaders can view their exam PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pension-exams' AND
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id::text = (storage.foldername(name))[1]
    AND pensions.leader_id = auth.uid()
  )
);