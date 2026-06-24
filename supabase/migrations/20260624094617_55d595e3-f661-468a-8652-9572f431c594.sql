
-- Helper: is user a leader OR admin (assistant) of the given pension?
CREATE OR REPLACE FUNCTION public.is_pension_admin_or_leader(_pension_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _pension_id IS NULL OR auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.pensions p
    WHERE p.id = _pension_id AND p.leader_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.pension_members m
    WHERE m.pension_id = _pension_id
      AND m.user_id = auth.uid()
      AND m.role IN ('leader','admin')
  );
END;
$$;

-- pension_exams: replace leader-only mutate policies with admin-or-leader
DROP POLICY IF EXISTS "Leaders can create pension exams" ON public.pension_exams;
DROP POLICY IF EXISTS "Leaders can update pension exams" ON public.pension_exams;
DROP POLICY IF EXISTS "Leaders can delete pension exams" ON public.pension_exams;

CREATE POLICY "Admins or leaders can create pension exams"
  ON public.pension_exams FOR INSERT TO authenticated
  WITH CHECK (public.is_pension_admin_or_leader(pension_id));

CREATE POLICY "Admins or leaders can update pension exams"
  ON public.pension_exams FOR UPDATE TO authenticated
  USING (public.is_pension_admin_or_leader(pension_id))
  WITH CHECK (public.is_pension_admin_or_leader(pension_id));

CREATE POLICY "Admins or leaders can delete pension exams"
  ON public.pension_exams FOR DELETE TO authenticated
  USING (public.is_pension_admin_or_leader(pension_id));

-- pension_announcements
DROP POLICY IF EXISTS "Leaders can create announcements" ON public.pension_announcements;
DROP POLICY IF EXISTS "Leaders can update their announcements" ON public.pension_announcements;
DROP POLICY IF EXISTS "Leaders can delete their announcements" ON public.pension_announcements;

CREATE POLICY "Admins or leaders can create announcements"
  ON public.pension_announcements FOR INSERT TO authenticated
  WITH CHECK (public.is_pension_admin_or_leader(pension_id));

CREATE POLICY "Admins or leaders can update announcements"
  ON public.pension_announcements FOR UPDATE TO authenticated
  USING (public.is_pension_admin_or_leader(pension_id))
  WITH CHECK (public.is_pension_admin_or_leader(pension_id));

CREATE POLICY "Admins or leaders can delete announcements"
  ON public.pension_announcements FOR DELETE TO authenticated
  USING (public.is_pension_admin_or_leader(pension_id));

-- pension_invites: admins can also create invites
DROP POLICY IF EXISTS "Leaders can create invites" ON public.pension_invites;
CREATE POLICY "Admins or leaders can create invites"
  ON public.pension_invites FOR INSERT TO authenticated
  WITH CHECK (public.is_pension_admin_or_leader(pension_id));

-- pension_members: admins can kick non-leader members; only primary leader can change roles
DROP POLICY IF EXISTS "Leaders can kick members from their pension" ON public.pension_members;
CREATE POLICY "Admins or leaders can kick non-leader members"
  ON public.pension_members FOR DELETE TO authenticated
  USING (
    public.is_pension_admin_or_leader(pension_id)
    AND user_id <> auth.uid()
    AND role <> 'leader'
  );

-- Allow primary leader (only) to update member roles (promote/demote admin)
DROP POLICY IF EXISTS "Leader can update member roles" ON public.pension_members;
CREATE POLICY "Leader can update member roles"
  ON public.pension_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pensions p
      WHERE p.id = pension_members.pension_id AND p.leader_id = auth.uid()
    )
    AND pension_members.user_id <> auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pensions p
      WHERE p.id = pension_members.pension_id AND p.leader_id = auth.uid()
    )
    AND role IN ('member','admin')
  );

-- Storage policies for pension-exams bucket: include admins
DROP POLICY IF EXISTS "pension_exam_upload" ON storage.objects;
DROP POLICY IF EXISTS "pension_exam_delete" ON storage.objects;

CREATE POLICY "pension_exam_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pension-exams'
    AND public.is_pension_admin_or_leader(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "pension_exam_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'pension-exams'
    AND public.is_pension_admin_or_leader(((storage.foldername(name))[1])::uuid)
  );
