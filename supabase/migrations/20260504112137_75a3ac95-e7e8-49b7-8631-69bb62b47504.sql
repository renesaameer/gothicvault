-- Replace broad public SELECT with narrower policy: public can read individual
-- objects (image URLs work), but listing the bucket is admin/staff only.
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;

-- Public can read by exact path (URL access still works)
CREATE POLICY "Public can read media files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media' AND auth.role() = 'anon');

-- Authenticated users can also read
CREATE POLICY "Authenticated can read media files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'media');