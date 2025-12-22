-- Add RLS policy for pension members to view each other's weekly plans
CREATE POLICY "Pension members can view each other weekly plans" 
ON public.weekly_plans 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1
    FROM pension_members pm1
    JOIN pension_members pm2 ON pm1.pension_id = pm2.pension_id
    WHERE pm1.user_id = auth.uid() 
    AND pm2.user_id = weekly_plans.user_id
  )
);

-- Add RLS policy for pension members to view each other's daily logs
CREATE POLICY "Pension members can view each other daily logs" 
ON public.daily_logs 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1
    FROM pension_members pm1
    JOIN pension_members pm2 ON pm1.pension_id = pm2.pension_id
    WHERE pm1.user_id = auth.uid() 
    AND pm2.user_id = daily_logs.user_id
  )
);