-- Create a table for wake-up times
CREATE TABLE public.wake_up_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pension_id UUID NOT NULL REFERENCES public.pensions(id) ON DELETE CASCADE,
  wake_time TIME NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pension_id, logged_date)
);

-- Enable RLS
ALTER TABLE public.wake_up_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own wake up logs
CREATE POLICY "Users can insert their own wake up logs"
ON public.wake_up_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own wake up logs
CREATE POLICY "Users can update their own wake up logs"
ON public.wake_up_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- Pension members can view wake up logs of their pension
CREATE POLICY "Pension members can view pension wake up logs"
ON public.wake_up_logs
FOR SELECT
USING (is_pension_member(pension_id));

-- Users can delete their own wake up logs
CREATE POLICY "Users can delete their own wake up logs"
ON public.wake_up_logs
FOR DELETE
USING (auth.uid() = user_id);