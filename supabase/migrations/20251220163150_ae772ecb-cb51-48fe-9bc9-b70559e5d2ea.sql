-- Step 1-2: Update profiles table with new fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS total_study_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tests INTEGER DEFAULT 0;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Step 6: Create exams table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pension_id UUID, -- NULL for personal exams
    title TEXT NOT NULL,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('simple', 'simulator')),
    lessons JSONB DEFAULT '[]'::jsonb, -- For simulator type: [{name, questionRange, timeMinutes}]
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Step 6: Create exam_results table
CREATE TABLE public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pension_id UUID, -- NULL for personal results
    exam_type TEXT NOT NULL,
    lesson_name TEXT,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    wrong_answers INTEGER NOT NULL DEFAULT 0,
    blank_answers INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0,
    lessons_data JSONB DEFAULT '[]'::jsonb, -- For simulator: results per lesson
    average_percentage NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Step 7-11: Create pensions (groups) table
CREATE TABLE public.pensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
    invite_enabled BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pensions ENABLE ROW LEVEL SECURITY;

-- Step 7-11: Create pension_members table
CREATE TABLE public.pension_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pension_id UUID REFERENCES public.pensions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id) -- User can only be in one pension
);

ALTER TABLE public.pension_members ENABLE ROW LEVEL SECURITY;

-- Step 7-11: Create pension_invites table for tracking invites
CREATE TABLE public.pension_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pension_id UUID REFERENCES public.pensions(id) ON DELETE CASCADE NOT NULL,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pension_id, invited_user_id)
);

ALTER TABLE public.pension_invites ENABLE ROW LEVEL SECURITY;

-- Add foreign key for pension_id in exams
ALTER TABLE public.exams 
ADD CONSTRAINT fk_exams_pension 
FOREIGN KEY (pension_id) REFERENCES public.pensions(id) ON DELETE CASCADE;

-- Add foreign key for pension_id in exam_results
ALTER TABLE public.exam_results 
ADD CONSTRAINT fk_exam_results_pension 
FOREIGN KEY (pension_id) REFERENCES public.pensions(id) ON DELETE CASCADE;

-- RLS Policies for exams
CREATE POLICY "Users can view their own exams"
ON public.exams FOR SELECT
USING (auth.uid() = created_by OR pension_id IS NULL);

CREATE POLICY "Users can create exams"
ON public.exams FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own exams"
ON public.exams FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own exams"
ON public.exams FOR DELETE
USING (auth.uid() = created_by);

-- RLS Policies for exam_results
CREATE POLICY "Users can view their own results"
ON public.exam_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results"
ON public.exam_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own results"
ON public.exam_results FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own results"
ON public.exam_results FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for pensions
CREATE POLICY "Anyone can view pensions"
ON public.pensions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create pensions"
ON public.pensions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leaders can update their pension"
ON public.pensions FOR UPDATE
TO authenticated
USING (auth.uid() = leader_id);

CREATE POLICY "Leaders can delete their pension"
ON public.pensions FOR DELETE
TO authenticated
USING (auth.uid() = leader_id);

-- RLS Policies for pension_members
CREATE POLICY "Members can view pension members"
ON public.pension_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join pensions"
ON public.pension_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave pensions"
ON public.pension_members FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for pension_invites
CREATE POLICY "Users can view their invites"
ON public.pension_invites FOR SELECT
TO authenticated
USING (auth.uid() = invited_user_id OR EXISTS (
    SELECT 1 FROM public.pensions WHERE id = pension_id AND leader_id = auth.uid()
));

CREATE POLICY "Leaders can create invites"
ON public.pension_invites FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.pensions WHERE id = pension_id AND leader_id = auth.uid()
));

CREATE POLICY "Users can update their invite status"
ON public.pension_invites FOR UPDATE
TO authenticated
USING (auth.uid() = invited_user_id);

-- Pension exam policies - members can view pension exams
CREATE POLICY "Pension members can view pension exams"
ON public.exams FOR SELECT
TO authenticated
USING (
    pension_id IS NULL OR 
    EXISTS (SELECT 1 FROM public.pension_members WHERE pension_id = exams.pension_id AND user_id = auth.uid())
);

-- Pension members can view pension exam results
CREATE POLICY "Pension members can view pension results"
ON public.exam_results FOR SELECT
TO authenticated
USING (
    pension_id IS NULL OR 
    EXISTS (SELECT 1 FROM public.pension_members WHERE pension_id = exam_results.pension_id AND user_id = auth.uid())
);

-- Function to update pension member count
CREATE OR REPLACE FUNCTION public.update_pension_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.pensions 
        SET member_count = member_count + 1 
        WHERE id = NEW.pension_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.pensions 
        SET member_count = member_count - 1 
        WHERE id = OLD.pension_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Trigger for member count
CREATE TRIGGER on_pension_member_change
AFTER INSERT OR DELETE ON public.pension_members
FOR EACH ROW
EXECUTE FUNCTION public.update_pension_member_count();

-- Update handle_new_user to include new profile fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;
  
  INSERT INTO public.profiles (
    user_id, 
    email, 
    display_name,
    first_name,
    last_name,
    username,
    total_study_minutes,
    total_tests
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''), 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', COALESCE(NEW.email, 'User')),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', ''),
    0,
    0
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_pensions_updated_at
BEFORE UPDATE ON public.pensions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_exams_created_by ON public.exams(created_by);
CREATE INDEX idx_exams_pension_id ON public.exams(pension_id);
CREATE INDEX idx_exam_results_user_id ON public.exam_results(user_id);
CREATE INDEX idx_exam_results_pension_id ON public.exam_results(pension_id);
CREATE INDEX idx_pension_members_pension_id ON public.pension_members(pension_id);
CREATE INDEX idx_pension_members_user_id ON public.pension_members(user_id);
CREATE INDEX idx_pensions_invite_code ON public.pensions(invite_code);
CREATE INDEX idx_pension_invites_pension_id ON public.pension_invites(pension_id);