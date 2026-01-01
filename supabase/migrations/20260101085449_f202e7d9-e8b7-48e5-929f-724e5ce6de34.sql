-- Create table for tracking study activities (clock circle data)
CREATE TABLE public.study_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('sleep', 'study', 'break', 'free_time')),
  subject TEXT,
  color TEXT,
  start_time TIME NOT NULL,
  end_time TIME,
  is_active BOOLEAN DEFAULT false,
  study_mode TEXT CHECK (study_mode IN ('pomodoro', 'free')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own activities" 
ON public.study_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Pension members can view each other activities" 
ON public.study_activities 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM pension_members pm1
  JOIN pension_members pm2 ON pm1.pension_id = pm2.pension_id
  WHERE pm1.user_id = auth.uid() AND pm2.user_id = study_activities.user_id
));

CREATE POLICY "Users can insert their own activities" 
ON public.study_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" 
ON public.study_activities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" 
ON public.study_activities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for user online status (real-time presence backup)
CREATE TABLE public.user_study_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_studying BOOLEAN DEFAULT false,
  current_subject TEXT,
  study_mode TEXT CHECK (study_mode IN ('pomodoro', 'free')),
  started_at TIMESTAMP WITH TIME ZONE,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_study_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for study status
CREATE POLICY "Anyone can view study status" 
ON public.user_study_status 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own status" 
ON public.user_study_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own status" 
ON public.user_study_status 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable realtime for user_study_status
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_study_status;