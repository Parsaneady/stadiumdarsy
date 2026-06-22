
CREATE TABLE public.announcement_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  title text,
  link_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_banners TO authenticated;
GRANT ALL ON public.announcement_banners TO service_role;

ALTER TABLE public.announcement_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.announcement_banners FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_insert" ON public.announcement_banners FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_update" ON public.announcement_banners FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_delete" ON public.announcement_banners FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "banner_own_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'announcement-banners' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "banner_own_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'announcement-banners' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "banner_own_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'announcement-banners' AND (storage.foldername(name))[1] = auth.uid()::text);
