-- Drop the current foreign key constraint that only references exams table
ALTER TABLE exam_results DROP CONSTRAINT exam_results_exam_id_fkey;

-- Make exam_id truly optional for pension exams by not having a foreign key constraint
-- The pension_id already identifies the pension, and exam_id can be used to store the pension_exam.id
-- without a foreign key constraint (since pension exams are stored separately)

-- Add a new column to explicitly link to pension_exams
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS pension_exam_id uuid REFERENCES pension_exams(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_exam_results_pension_exam_id ON exam_results(pension_exam_id);