/*
# Create storage bucket for photo uploads

1. Storage
- Create a public bucket named 'photos' for construction site photos.
- Allow authenticated users to upload to it.
- Allow public read access (photos are shared across all users).

2. Policies
- INSERT: authenticated users can upload files.
- SELECT: anyone can read (public bucket).
- UPDATE/DELETE: owner or admin can modify/delete.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "photos_upload_authenticated" ON storage.objects;
CREATE POLICY "photos_upload_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos');

-- Allow public read
DROP POLICY IF EXISTS "photos_read_public" ON storage.objects;
CREATE POLICY "photos_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- Allow owner or admin to update
DROP POLICY IF EXISTS "photos_update_own_or_admin" ON storage.objects;
CREATE POLICY "photos_update_own_or_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'photos'
    AND (
      owner = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND (
      owner = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

-- Allow owner or admin to delete
DROP POLICY IF EXISTS "photos_delete_own_or_admin" ON storage.objects;
CREATE POLICY "photos_delete_own_or_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'photos'
    AND (
      owner = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );
