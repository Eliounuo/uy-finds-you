
-- =========================================================
-- UY Pre-Launch Hardening — Wave 1
-- =========================================================

-- 1) PUBLIC USER ID (UY-000001 …)
CREATE SEQUENCE IF NOT EXISTS public.profiles_public_id_seq START 1;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS telegram text;

CREATE OR REPLACE FUNCTION public.assign_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := 'UY-' || lpad(nextval('public.profiles_public_id_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_public_id ON public.profiles;
CREATE TRIGGER trg_profiles_public_id
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_public_id();

-- Backfill existing rows (ordered by created_at for stable numbering)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE public_id IS NULL ORDER BY created_at LOOP
    UPDATE public.profiles
      SET public_id = 'UY-' || lpad(nextval('public.profiles_public_id_seq')::text, 6, '0')
      WHERE id = r.id;
  END LOOP;
END $$;

-- 2) PUBLIC PROFILE RPC (safe fields visible to any authenticated user)
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE(
  id uuid,
  public_id text,
  full_name text,
  avatar_url text,
  is_landlord boolean,
  verification_status verification_status,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.public_id, p.full_name, p.avatar_url,
         p.is_landlord, p.verification_status, p.created_at
  FROM public.profiles p
  WHERE p.id = _user_id
$$;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;

-- 3) CONTACT PROTECTION — reveal phone/whatsapp/telegram only when
--    caller and target share a confirmed booking, are admin, or self.
CREATE OR REPLACE FUNCTION public.can_view_contacts(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    _viewer IS NOT NULL AND (
      _viewer = _target
      OR public.has_role(_viewer, 'admin')
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.status IN ('confirmed','completed')
          AND ((b.client_id = _viewer AND b.owner_id = _target)
            OR (b.owner_id  = _viewer AND b.client_id = _target))
      )
      OR EXISTS (
        SELECT 1 FROM public.offers o
        JOIN public.requests r ON r.id = o.request_id
        WHERE o.status = 'accepted'
          AND ((r.client_id = _viewer AND o.owner_id = _target)
            OR (o.owner_id  = _viewer AND r.client_id = _target))
      )
    )
$$;

CREATE OR REPLACE FUNCTION public.get_contact_info(_user_id uuid)
RETURNS TABLE(phone text, whatsapp text, telegram text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.phone, p.whatsapp, p.telegram
  FROM public.profiles p
  WHERE p.id = _user_id
    AND public.can_view_contacts(auth.uid(), _user_id)
$$;
GRANT EXECUTE ON FUNCTION public.get_contact_info(uuid) TO authenticated;

-- 4) IMPROVED MATCHING — adds distance (haversine, km), match_score, rating
DROP FUNCTION IF EXISTS public.match_properties_for_request(uuid);
CREATE OR REPLACE FUNCTION public.match_properties_for_request(_request_id uuid)
RETURNS TABLE(
  id uuid, title text, city text, district text,
  price_per_night integer, rooms integer, guests integer,
  rating numeric, reviews_count integer,
  photos text[], amenities text[],
  distance_km numeric, match_score integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH r AS (SELECT * FROM public.requests WHERE id = _request_id)
  SELECT
    p.id, p.title, p.city, p.district, p.price_per_night,
    p.rooms, p.guests, p.rating, p.reviews_count, p.photos, p.amenities,
    CASE
      WHEN (SELECT lat FROM r) IS NOT NULL AND (SELECT lng FROM r) IS NOT NULL
       AND p.lat IS NOT NULL AND p.lng IS NOT NULL
      THEN round((
        6371 * acos(
          greatest(-1, least(1,
            cos(radians((SELECT lat FROM r)::float8)) * cos(radians(p.lat::float8))
            * cos(radians(p.lng::float8) - radians((SELECT lng FROM r)::float8))
            + sin(radians((SELECT lat FROM r)::float8)) * sin(radians(p.lat::float8))
          ))
        )
      )::numeric, 2)
      ELSE NULL
    END AS distance_km,
    (
      (CASE WHEN p.city = (SELECT city FROM r) THEN 30 ELSE 0 END) +
      (CASE WHEN p.price_per_night <= (SELECT budget_max FROM r) THEN 20
            WHEN p.price_per_night <= (SELECT budget_max FROM r) * 1.15 THEN 10
            ELSE 0 END) +
      (CASE WHEN p.guests >= (SELECT guests FROM r) THEN 10 ELSE 0 END) +
      (CASE WHEN (SELECT rooms FROM r) IS NULL OR p.rooms >= (SELECT rooms FROM r) THEN 8 ELSE 0 END) +
      (CASE WHEN COALESCE(array_length((SELECT amenities FROM r), 1), 0) = 0 THEN 0
            ELSE (SELECT count(*)::int * 2 FROM unnest((SELECT amenities FROM r)) a WHERE a = ANY(p.amenities))
       END) +
      LEAST((p.rating * 2)::int, 10) +
      (CASE
         WHEN (SELECT lat FROM r) IS NULL OR p.lat IS NULL THEN 0
         WHEN 6371 * acos(greatest(-1, least(1,
              cos(radians((SELECT lat FROM r)::float8)) * cos(radians(p.lat::float8))
              * cos(radians(p.lng::float8) - radians((SELECT lng FROM r)::float8))
              + sin(radians((SELECT lat FROM r)::float8)) * sin(radians(p.lat::float8))
            ))) < 2 THEN 20
         WHEN 6371 * acos(greatest(-1, least(1,
              cos(radians((SELECT lat FROM r)::float8)) * cos(radians(p.lat::float8))
              * cos(radians(p.lng::float8) - radians((SELECT lng FROM r)::float8))
              + sin(radians((SELECT lat FROM r)::float8)) * sin(radians(p.lat::float8))
            ))) < 5 THEN 12
         ELSE 4
       END)
    )::int AS match_score
  FROM public.properties p
  WHERE p.status = 'active'
    AND p.city = (SELECT city FROM r)
    AND p.price_per_night <= (SELECT budget_max FROM r) * 1.25
    AND p.guests >= (SELECT guests FROM r)
    AND public.is_property_available(p.id, (SELECT check_in FROM r), (SELECT check_out FROM r))
  ORDER BY match_score DESC, p.rating DESC, p.price_per_night ASC
  LIMIT 30;
$$;
GRANT EXECUTE ON FUNCTION public.match_properties_for_request(uuid) TO authenticated;

-- 5) PROPERTY PUBLISH QUALITY GUARD
CREATE OR REPLACE FUNCTION public.enforce_property_publish_quality()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    IF COALESCE(array_length(NEW.photos, 1), 0) < 5 THEN
      RAISE EXCEPTION 'Нужно минимум 5 фото для публикации' USING ERRCODE='check_violation';
    END IF;
    IF NEW.price_per_night IS NULL OR NEW.price_per_night <= 0 THEN
      RAISE EXCEPTION 'Укажите цену за сутки' USING ERRCODE='check_violation';
    END IF;
    IF NEW.description IS NULL OR length(trim(NEW.description)) < 20 THEN
      RAISE EXCEPTION 'Описание минимум 20 символов' USING ERRCODE='check_violation';
    END IF;
    IF NEW.address IS NULL OR length(trim(NEW.address)) < 3 THEN
      RAISE EXCEPTION 'Укажите адрес' USING ERRCODE='check_violation';
    END IF;
    IF NEW.lat IS NULL OR NEW.lng IS NULL THEN
      RAISE EXCEPTION 'Укажите координаты на карте' USING ERRCODE='check_violation';
    END IF;
    IF NEW.guests IS NULL OR NEW.guests < 1 THEN
      RAISE EXCEPTION 'Укажите количество гостей' USING ERRCODE='check_violation';
    END IF;
    IF NEW.rooms IS NULL OR NEW.rooms < 1 THEN
      RAISE EXCEPTION 'Укажите количество комнат' USING ERRCODE='check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_property_publish_quality ON public.properties;
CREATE TRIGGER trg_property_publish_quality
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.enforce_property_publish_quality();

-- 6) Index hints for performance
CREATE INDEX IF NOT EXISTS idx_properties_city_status ON public.properties (city, status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties (price_per_night);
CREATE INDEX IF NOT EXISTS idx_bookings_status_dates ON public.bookings (property_id, status, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, read_at) WHERE read_at IS NULL;
