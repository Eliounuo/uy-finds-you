
-- Phase 1: Anti-double-booking protection
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Exclusion constraint: no two active bookings on the same property with overlapping date ranges.
-- Uses half-open range [check_in, check_out) so back-to-back bookings (checkout = checkin) are allowed.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_date_overlap
  EXCLUDE USING gist (
    property_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  WHERE (status = 'confirmed');

-- Helper: returns true if the property has NO confirmed booking overlapping the given range.
CREATE OR REPLACE FUNCTION public.is_property_available(
  _property_id uuid,
  _check_in date,
  _check_out date,
  _exclude_booking_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE property_id = _property_id
      AND status = 'confirmed'
      AND (_exclude_booking_id IS NULL OR id <> _exclude_booking_id)
      AND daterange(check_in, check_out, '[)') && daterange(_check_in, _check_out, '[)')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_property_available(uuid, date, date, uuid) TO authenticated, anon;

-- Harden offer-accept trigger: check availability before creating the booking.
-- If dates conflict, raise an exception so the owner sees a clear error and the offer stays pending.
CREATE OR REPLACE FUNCTION public.handle_offer_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.requests%ROWTYPE;
  v_booking_id uuid;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    SELECT * INTO v_req FROM public.requests WHERE id = NEW.request_id;

    -- Guard: dates must still be free for this property
    IF NOT public.is_property_available(NEW.property_id, v_req.check_in, v_req.check_out) THEN
      RAISE EXCEPTION 'Property % is already booked for the requested dates', NEW.property_id
        USING ERRCODE = 'check_violation';
    END IF;

    INSERT INTO public.bookings (client_id, owner_id, property_id, offer_id, check_in, check_out, guests, total_price)
    VALUES (v_req.client_id, NEW.owner_id, NEW.property_id, NEW.id, v_req.check_in, v_req.check_out, v_req.guests, NEW.total_price)
    RETURNING id INTO v_booking_id;

    INSERT INTO public.chats (client_id, owner_id, property_id, offer_id)
    VALUES (v_req.client_id, NEW.owner_id, NEW.property_id, NEW.id)
    ON CONFLICT (offer_id) DO NOTHING;

    UPDATE public.requests SET status = 'closed' WHERE id = NEW.request_id;
    UPDATE public.offers SET status = 'declined'
      WHERE request_id = NEW.request_id AND id <> NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END $$;
