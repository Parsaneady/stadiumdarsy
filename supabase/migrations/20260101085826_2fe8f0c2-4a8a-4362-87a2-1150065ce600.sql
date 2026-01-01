-- Add unique constraint for wake_up_logs per user per day
ALTER TABLE public.wake_up_logs 
ADD CONSTRAINT unique_user_date UNIQUE (user_id, logged_date);