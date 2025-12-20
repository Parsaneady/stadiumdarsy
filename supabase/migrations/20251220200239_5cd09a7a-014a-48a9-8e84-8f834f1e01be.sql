-- Add question_count column to pension_exams table
ALTER TABLE public.pension_exams 
ADD COLUMN question_count integer NOT NULL DEFAULT 60;