-- Fix: Add DELETE policy for pomodoro_sessions
CREATE POLICY "Users can delete their own pomodoro sessions"
ON public.pomodoro_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Fix: Add UPDATE policy for pomodoro_sessions (for data correction)
CREATE POLICY "Users can update their own pomodoro sessions"
ON public.pomodoro_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Fix: Add input validation to handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;
  
  -- Insert profile with validated data
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''), 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', COALESCE(NEW.email, 'User'))
  );
  
  -- Insert user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Fix: Add input validation to has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Fix: Add input validation to is_sargarooh function
CREATE OR REPLACE FUNCTION public.is_sargarooh(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'سرگروه'
  );
END;
$$;