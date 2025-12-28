-- Make the pension-exams bucket private to prevent direct URL access
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pension-exams';