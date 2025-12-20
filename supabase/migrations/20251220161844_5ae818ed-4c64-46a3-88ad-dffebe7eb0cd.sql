-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'سرگروه', 'member');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is سرگروه
CREATE OR REPLACE FUNCTION public.is_sargarooh(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'سرگروه'
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create challenges table
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for challenges
CREATE POLICY "Everyone can view challenges"
ON public.challenges FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only سرگروه can create challenges"
ON public.challenges FOR INSERT
TO authenticated
WITH CHECK (public.is_sargarooh(auth.uid()));

CREATE POLICY "Only creator can update their challenges"
ON public.challenges FOR UPDATE
TO authenticated
USING (auth.uid() = created_by AND public.is_sargarooh(auth.uid()));

CREATE POLICY "Only creator can delete their challenges"
ON public.challenges FOR DELETE
TO authenticated
USING (auth.uid() = created_by AND public.is_sargarooh(auth.uid()));

-- Create challenge_participants table
CREATE TABLE public.challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (challenge_id, user_id)
);

-- Enable RLS on challenge_participants
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for challenge_participants
CREATE POLICY "Users can view all participants"
ON public.challenge_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join challenges"
ON public.challenge_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges"
ON public.challenge_participants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at on challenges
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_challenges_created_by ON public.challenges(created_by);
CREATE INDEX idx_challenges_start_date ON public.challenges(start_date);
CREATE INDEX idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user_id ON public.challenge_participants(user_id);