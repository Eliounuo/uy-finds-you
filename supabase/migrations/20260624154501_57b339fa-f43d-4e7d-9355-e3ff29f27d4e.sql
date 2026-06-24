-- ============ 1. requests: missing fields ============
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS rooms integer,
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric;

-- ============ 2. property_availability ============
CREATE TABLE IF NOT EXISTS public.property_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'booking' CHECK (source IN ('booking','manual_block')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date > start_date),
  EXCLUDE USING gist (
    property_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  )
);

GRANT SELECT ON public.property_availability TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_availability TO authenticated;
GRANT ALL ON public.property_availability TO service_role;

ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
  ON public.property_availability FOR SELECT
  USING (true);

CREATE POLICY "Owner manages availability"
  ON public.property_availability FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_property_availability_property ON public.property_availability(property_id);

-- Auto-sync with bookings: confirmed booking -> availability row
CREATE OR REPLACE FUNCTION public.sync_availability_from_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.property_availability(property_id, start_date, end_date, booking_id, source)
      VALUES (NEW.property_id, NEW.check_in, NEW.check_out, NEW.id, 'booking')
      ON CONFLICT DO NOTHING;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
      DELETE FROM public.property_availability WHERE booking_id = NEW.id;
    ELSIF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
      INSERT INTO public.property_availability(property_id, start_date, end_date, booking_id, source)
      VALUES (NEW.property_id, NEW.check_in, NEW.check_out, NEW.id, 'booking')
      ON CONFLICT DO NOTHING;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.property_availability WHERE booking_id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_sync_availability ON public.bookings;
CREATE TRIGGER trg_sync_availability
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_availability_from_booking();

-- Backfill from existing confirmed bookings
INSERT INTO public.property_availability(property_id, start_date, end_date, booking_id, source)
SELECT property_id, check_in, check_out, id, 'booking'
FROM public.bookings
WHERE status = 'confirmed'
ON CONFLICT DO NOTHING;

-- ============ 3. agent_settings ============
CREATE TABLE IF NOT EXISTS public.agent_settings (
  owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  minimum_price integer,
  negotiation_limit_percent integer DEFAULT 10 CHECK (negotiation_limit_percent BETWEEN 0 AND 100),
  auto_reply boolean NOT NULL DEFAULT false,
  house_rules text,
  check_in_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_settings TO authenticated;
GRANT ALL ON public.agent_settings TO service_role;

ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own agent settings"
  ON public.agent_settings FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_agent_settings_updated ON public.agent_settings;
CREATE TRIGGER trg_agent_settings_updated
BEFORE UPDATE ON public.agent_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 4. match_properties_for_request ============
CREATE OR REPLACE FUNCTION public.match_properties_for_request(_request_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  city text,
  district text,
  price_per_night integer,
  rooms integer,
  guests integer,
  rating numeric,
  reviews_count integer,
  photos text[],
  amenities text[],
  score integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH r AS (
    SELECT * FROM public.requests WHERE id = _request_id
  )
  SELECT
    p.id, p.title, p.city, p.district, p.price_per_night,
    p.rooms, p.guests, p.rating, p.reviews_count, p.photos, p.amenities,
    (
      (CASE WHEN p.city = (SELECT city FROM r) THEN 40 ELSE 0 END) +
      (CASE WHEN p.price_per_night <= (SELECT budget_max FROM r) THEN 25 ELSE 0 END) +
      (CASE WHEN p.guests >= (SELECT guests FROM r) THEN 15 ELSE 0 END) +
      (CASE WHEN (SELECT rooms FROM r) IS NULL OR p.rooms >= (SELECT rooms FROM r) THEN 10 ELSE 0 END) +
      (CASE WHEN COALESCE(array_length((SELECT amenities FROM r), 1), 0) = 0
            THEN 0
            ELSE (
              SELECT count(*)::int * 2
              FROM unnest((SELECT amenities FROM r)) a
              WHERE a = ANY(p.amenities)
            )
       END) +
      LEAST(p.rating::int * 2, 10)
    )::int AS score
  FROM public.properties p
  WHERE p.status = 'active'
    AND p.city = (SELECT city FROM r)
    AND p.price_per_night <= (SELECT budget_max FROM r) * 1.15
    AND p.guests >= (SELECT guests FROM r)
    AND public.is_property_available(p.id, (SELECT check_in FROM r), (SELECT check_out FROM r))
  ORDER BY score DESC, p.rating DESC, p.price_per_night ASC
  LIMIT 30;
$$;

GRANT EXECUTE ON FUNCTION public.match_properties_for_request(uuid) TO authenticated;