-- Add marked_questions column to test_books table
ALTER TABLE public.test_books 
ADD COLUMN IF NOT EXISTS marked_questions JSONB DEFAULT '[]'::jsonb;