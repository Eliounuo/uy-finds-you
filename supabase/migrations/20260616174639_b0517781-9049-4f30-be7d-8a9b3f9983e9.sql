
ALTER VIEW public.property_ratings SET (security_invoker = true);
ALTER VIEW public.owner_ratings SET (security_invoker = true);

DROP POLICY IF EXISTS "Users upload own verification docs" ON storage.objects;
CREATE POLICY "Users upload own verification docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own verification docs" ON storage.objects;
CREATE POLICY "Users read own verification docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS "Users delete own verification docs" ON storage.objects;
CREATE POLICY "Users delete own verification docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
