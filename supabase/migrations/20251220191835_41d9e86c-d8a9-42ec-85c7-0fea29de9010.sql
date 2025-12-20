-- Allow pension members to view profiles of other pension members
CREATE POLICY "Pension members can view each other profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pension_members pm1
    JOIN pension_members pm2 ON pm1.pension_id = pm2.pension_id
    WHERE pm1.user_id = auth.uid()
    AND pm2.user_id = profiles.user_id
  )
);