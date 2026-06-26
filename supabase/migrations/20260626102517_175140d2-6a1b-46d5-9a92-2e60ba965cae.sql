
DROP VIEW IF EXISTS public.open_requests_public;

DROP POLICY IF EXISTS "Owners and admins see requests" ON public.requests;
CREATE POLICY "Authenticated see open requests or own" ON public.requests
  FOR SELECT TO authenticated
  USING (status = 'open' OR client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

REVOKE SELECT (lat, lng, notes) ON public.requests FROM authenticated;
REVOKE SELECT (lat, lng, notes) ON public.requests FROM anon;

CREATE OR REPLACE FUNCTION public.get_own_request(_id uuid)
RETURNS SETOF public.requests
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
  SELECT * FROM public.requests WHERE id = _id AND client_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_own_request(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_own_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_own_request(uuid) TO authenticated;
