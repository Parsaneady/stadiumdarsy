-- Drop the problematic policy that still exposes all pensions with invite_enabled
DROP POLICY IF EXISTS "Users can lookup pension by invite code" ON public.pensions;