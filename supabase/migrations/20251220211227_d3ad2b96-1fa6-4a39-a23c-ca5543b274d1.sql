-- Create storage bucket for pension exam PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pension-exams', 'pension-exams', true)
ON CONFLICT (id) DO NOTHING;

-- Allow pension leaders to upload files
CREATE POLICY "Leaders can upload exam PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pension-exams' AND
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id::text = (storage.foldername(name))[1]
    AND pensions.leader_id = auth.uid()
  )
);

-- Allow pension members to view exam PDFs
CREATE POLICY "Pension members can view exam PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pension-exams' AND
  EXISTS (
    SELECT 1 FROM pension_members
    WHERE pension_members.pension_id::text = (storage.foldername(name))[1]
    AND pension_members.user_id = auth.uid()
  )
);

-- Allow leaders to delete exam PDFs
CREATE POLICY "Leaders can delete exam PDFs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pension-exams' AND
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id::text = (storage.foldername(name))[1]
    AND pensions.leader_id = auth.uid()
  )
);