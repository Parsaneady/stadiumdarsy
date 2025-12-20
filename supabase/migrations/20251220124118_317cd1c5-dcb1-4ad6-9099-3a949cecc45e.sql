-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create weekly_plans table
CREATE TABLE public.weekly_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  sessions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_index)
);

-- Create daily_logs table
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_study_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_tests INTEGER NOT NULL DEFAULT 0,
  completed_sessions INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  overall_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  feedback TEXT,
  sessions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create user_settings table for pomodoro and other settings
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pomodoro_study_duration INTEGER NOT NULL DEFAULT 25,
  pomodoro_short_break INTEGER NOT NULL DEFAULT 5,
  pomodoro_long_break INTEGER NOT NULL DEFAULT 15,
  pomodoro_cycles INTEGER NOT NULL DEFAULT 4,
  streak INTEGER NOT NULL DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create pomodoro_sessions table
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  persian_year INTEGER,
  persian_month INTEGER,
  persian_day INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for weekly_plans
CREATE POLICY "Users can view their own weekly plans" ON public.weekly_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own weekly plans" ON public.weekly_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weekly plans" ON public.weekly_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weekly plans" ON public.weekly_plans FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for daily_logs
CREATE POLICY "Users can view their own daily logs" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for pomodoro_sessions
CREATE POLICY "Users can view their own pomodoro sessions" ON public.pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pomodoro sessions" ON public.pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for calendar_events
CREATE POLICY "Users can view their own calendar events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_plans_updated_at BEFORE UPDATE ON public.weekly_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile and settings on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_weekly_plans_user_id ON public.weekly_plans(user_id);
CREATE INDEX idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX idx_daily_logs_date ON public.daily_logs(date);
CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events(user_id);