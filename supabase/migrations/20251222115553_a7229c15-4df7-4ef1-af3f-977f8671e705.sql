-- Drop the incorrect policies (using pensions.name instead of storage object name)
DROP POLICY IF EXISTS "Leaders can upload pension exam files" ON storage.objects;
DROP POLICY IF EXISTS "Leaders can update pension exam files" ON storage.objects;
DROP POLICY IF EXISTS "Leaders can delete pension exam files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view pension exam files" ON storage.objects;