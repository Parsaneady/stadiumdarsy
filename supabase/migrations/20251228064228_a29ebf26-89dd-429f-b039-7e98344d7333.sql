-- Add last_weekly_reset column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS last_weekly_reset date NULL;