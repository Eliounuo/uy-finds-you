
CREATE OR REPLACE FUNCTION public.enforce_booking_update_scope()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(v_uid, 'admin') THEN RETURN NEW; END IF;

  IF v_uid = OLD.client_id AND v_uid <> OLD.owner_id THEN
    IF NEW.status      IS DISTINCT FROM OLD.status
    OR NEW.total_price IS DISTINCT FROM OLD.total_price
    OR NEW.owner_id    IS DISTINCT FROM OLD.owner_id
    OR NEW.client_id   IS DISTINCT FROM OLD.client_id
    OR NEW.property_id IS DISTINCT FROM OLD.property_id
    OR NEW.offer_id    IS DISTINCT FROM OLD.offer_id
    OR NEW.check_in    IS DISTINCT FROM OLD.check_in
    OR NEW.check_out   IS DISTINCT FROM OLD.check_out THEN
      RAISE EXCEPTION 'Clients can only update guests on a booking'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF v_uid = OLD.owner_id THEN
    IF NEW.client_id   IS DISTINCT FROM OLD.client_id
    OR NEW.owner_id    IS DISTINCT FROM OLD.owner_id
    OR NEW.property_id IS DISTINCT FROM OLD.property_id
    OR NEW.offer_id    IS DISTINCT FROM OLD.offer_id
    OR NEW.total_price IS DISTINCT FROM OLD.total_price
    OR NEW.check_in    IS DISTINCT FROM OLD.check_in
    OR NEW.check_out   IS DISTINCT FROM OLD.check_out
    OR NEW.guests      IS DISTINCT FROM OLD.guests THEN
      RAISE EXCEPTION 'Owners can only update booking status'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_booking_update_scope ON public.bookings;
CREATE TRIGGER trg_enforce_booking_update_scope
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_update_scope();

DROP POLICY IF EXISTS "Authenticated see open requests or own" ON public.requests;
DROP POLICY IF EXISTS "Owners and admins see requests" ON public.requests;
CREATE POLICY "Owners and admins see requests" ON public.requests
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.open_requests_public
WITH (security_invoker = false) AS
SELECT id, client_id, city, district, check_in, check_out, guests,
       budget_max, amenities, status, created_at
FROM public.requests
WHERE status = 'open';

GRANT SELECT ON public.open_requests_public TO authenticated;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push subs" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
