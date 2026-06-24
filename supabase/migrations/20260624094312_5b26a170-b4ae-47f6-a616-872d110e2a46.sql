
-- Grant admin role to the owner
INSERT INTO public.user_roles (user_id, role)
VALUES ('dc659dec-3121-43e1-8665-cde83a4ed02e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Reset banner table policies: everyone signed-in can read, only admins can mutate
DROP POLICY IF EXISTS "Users can view their own banners" ON public.announcement_banners;
DROP POLICY IF EXISTS "Users can insert their own banners" ON public.announcement_banners;
DROP POLICY IF EXISTS "Users can update their own banners" ON public.announcement_banners;
DROP POLICY IF EXISTS "Users can delete their own banners" ON public.announcement_banners;

CREATE POLICY "Anyone signed-in can view banners"
  ON public.announcement_banners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert banners"
  ON public.announcement_banners FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banners"
  ON public.announcement_banners FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banners"
  ON public.announcement_banners FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for announcement-banners bucket
DROP POLICY IF EXISTS "Users can view own banner files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own banner files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own banner files" ON storage.objects;
DROP POLICY IF EXISTS "announcement_banners_select_own" ON storage.objects;
DROP POLICY IF EXISTS "announcement_banners_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "announcement_banners_delete_own" ON storage.objects;

CREATE POLICY "Anyone signed-in can read banner files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'announcement-banners');

CREATE POLICY "Admins can upload banner files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'announcement-banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banner files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'announcement-banners' AND public.has_role(auth.uid(), 'admin'));
