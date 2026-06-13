
CREATE POLICY "Authenticated read property photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'property-photos');

CREATE POLICY "Anon read property photos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'property-photos');

CREATE POLICY "Owners upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners update own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
