
-- Create media storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to media bucket
CREATE POLICY "Public read media" ON storage.objects FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to upload to media bucket
CREATE POLICY "Authenticated upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to delete from media bucket
CREATE POLICY "Authenticated delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');

-- Allow authenticated users to update media
CREATE POLICY "Authenticated update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media');
