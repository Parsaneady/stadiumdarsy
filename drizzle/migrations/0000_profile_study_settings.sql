ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grade integer,
  ADD COLUMN IF NOT EXISTS field text,
  ADD COLUMN IF NOT EXISTS exam_date date,
  ADD COLUMN IF NOT EXISTS daily_minutes integer DEFAULT 240,
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;