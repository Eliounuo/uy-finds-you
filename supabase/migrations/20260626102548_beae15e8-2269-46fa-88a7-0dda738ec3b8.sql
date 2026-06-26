
CREATE OR REPLACE FUNCTION public.get_my_requests()
RETURNS SETOF public.requests
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
  SELECT * FROM public.requests
  WHERE client_id = auth.uid()
  ORDER BY created_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_requests() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_requests() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_requests() TO authenticated;
