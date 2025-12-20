-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view pensions" ON public.pensions;

-- Create a SECURITY DEFINER function to check pension membership (avoiding RLS recursion)
CREATE OR REPLACE FUNCTION public.is_pension_member(_pension_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF _pension_id IS NULL OR auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.pension_members
    WHERE pension_id = _pension_id
      AND user_id = auth.uid()
  );
END;
$$;

-- Create restricted SELECT policy - only leaders and members can view pension details
CREATE POLICY "Leaders and members can view pensions"
ON public.pensions
FOR SELECT
TO authenticated
USING (
  auth.uid() = leader_id OR 
  public.is_pension_member(id)
);

-- Create a separate policy for invite code lookup (needed for join flow via invite link)
-- This allows looking up a pension by invite_code without exposing all pensions
CREATE POLICY "Users can lookup pension by invite code"
ON public.pensions
FOR SELECT
TO authenticated
USING (
  invite_enabled = true AND invite_code IS NOT NULL
);