-- SECURITY DEFINER bypasses RLS — safe because auth.uid() is pinned inside
CREATE OR REPLACE FUNCTION public.save_my_profile(
  p_full_name text,
  p_phone     text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (auth.uid(), p_full_name, p_phone)
  ON CONFLICT (id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        phone      = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_my_profile(text, text) TO authenticated;
