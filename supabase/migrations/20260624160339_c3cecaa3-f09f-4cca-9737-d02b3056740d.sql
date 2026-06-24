-- Update get_public_profile to include rating and review_count (computed from owner's properties)
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE(
  id uuid,
  public_id text,
  full_name text,
  avatar_url text,
  is_landlord boolean,
  verification_status verification_status,
  rating numeric,
  reviews_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.public_id,
    p.full_name,
    p.avatar_url,
    p.is_landlord,
    p.verification_status,
    COALESCE(
      (SELECT round(
         (SUM(pr.rating * pr.reviews_count) / NULLIF(SUM(pr.reviews_count), 0))::numeric, 2)
       FROM public.properties pr
       WHERE pr.owner_id = p.id AND pr.reviews_count > 0),
      0
    )::numeric AS rating,
    COALESCE(
      (SELECT SUM(pr.reviews_count)::int
       FROM public.properties pr WHERE pr.owner_id = p.id),
      0
    ) AS reviews_count,
    p.created_at
  FROM public.profiles p
  WHERE p.id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;