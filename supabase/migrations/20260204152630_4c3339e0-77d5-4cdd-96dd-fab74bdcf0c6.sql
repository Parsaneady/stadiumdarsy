-- Add policy for pension leaders to kick members
CREATE POLICY "Leaders can kick members from their pension"
ON public.pension_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.pensions
    WHERE pensions.id = pension_members.pension_id
      AND pensions.leader_id = auth.uid()
      AND pension_members.user_id != auth.uid()  -- Leader can't kick themselves
  )
);