-- Create pension_announcements table for leader announcements
CREATE TABLE public.pension_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pension_id UUID NOT NULL REFERENCES public.pensions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pension_announcements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Pension members can view announcements"
ON public.pension_announcements
FOR SELECT
USING (is_pension_member(pension_id));

CREATE POLICY "Leaders can create announcements"
ON public.pension_announcements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id = pension_id
    AND pensions.leader_id = auth.uid()
  )
);

CREATE POLICY "Leaders can update their announcements"
ON public.pension_announcements
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id = pension_id
    AND pensions.leader_id = auth.uid()
  )
);

CREATE POLICY "Leaders can delete their announcements"
ON public.pension_announcements
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id = pension_id
    AND pensions.leader_id = auth.uid()
  )
);

-- Create pension_exams table with scheduling
CREATE TABLE public.pension_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pension_id UUID NOT NULL REFERENCES public.pensions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  exam_type TEXT NOT NULL DEFAULT 'tashrihi',
  lessons JSONB DEFAULT '[]'::jsonb,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pension_exams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pension_exams
CREATE POLICY "Pension members can view pension exams"
ON public.pension_exams
FOR SELECT
USING (is_pension_member(pension_id));

CREATE POLICY "Leaders can create pension exams"
ON public.pension_exams
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id = pension_id
    AND pensions.leader_id = auth.uid()
  )
);

CREATE POLICY "Leaders can update pension exams"
ON public.pension_exams
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id = pension_id
    AND pensions.leader_id = auth.uid()
  )
);

CREATE POLICY "Leaders can delete pension exams"
ON public.pension_exams
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pensions
    WHERE pensions.id = pension_id
    AND pensions.leader_id = auth.uid()
  )
);