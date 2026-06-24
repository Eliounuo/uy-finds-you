
-- =====================================================================
-- Security hardening: messages RLS, profiles is_landlord lock,
-- offers total_price validation, requests rate limit
-- =====================================================================

-- 1) MESSAGES RLS — ensure only chat participants can SELECT/INSERT.
--    (Policies already exist via is_chat_participant; recreate idempotently to be safe.)
DROP POLICY IF EXISTS "Participants see messages" ON public.messages;
DROP POLICY IF EXISTS "Participants insert messages" ON public.messages;

CREATE POLICY "Participants see messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_chat_participant(chat_id, auth.uid()));

CREATE POLICY "Participants insert messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_chat_participant(chat_id, auth.uid()));

-- 2) PROFILES — prevent self-promotion to landlord.
--    UPDATE policy stays as-is, but a trigger blocks is_landlord / verification_status
--    changes for non-admin, non-service-role callers.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  -- service_role bypass
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    v_is_admin := public.has_role(auth.uid(), 'admin');
  END IF;

  IF NOT v_is_admin THEN
    IF NEW.is_landlord IS DISTINCT FROM OLD.is_landlord THEN
      RAISE EXCEPTION 'Landlord status can only be changed via business logic, not by direct profile update'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Verification status is managed by the verification workflow'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Dedicated RPC to become a landlord (business logic gate).
CREATE OR REPLACE FUNCTION public.become_landlord()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.profiles
    SET is_landlord = true, mode = 'pro'
    WHERE id = auth.uid();
END $$;

REVOKE EXECUTE ON FUNCTION public.become_landlord() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.become_landlord() TO authenticated;

-- 3) OFFERS — server-side total_price validation.
CREATE OR REPLACE FUNCTION public.validate_offer_total_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.requests%ROWTYPE;
  v_nights integer;
  v_expected integer;
BEGIN
  SELECT * INTO v_req FROM public.requests WHERE id = NEW.request_id;
  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Request % not found', NEW.request_id USING ERRCODE = 'foreign_key_violation';
  END IF;

  v_nights := (v_req.check_out - v_req.check_in);
  IF v_nights <= 0 THEN
    RAISE EXCEPTION 'Invalid stay length' USING ERRCODE = 'check_violation';
  END IF;

  v_expected := NEW.price_per_night * v_nights;
  IF NEW.total_price IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION 'total_price (%) must equal price_per_night (%) × nights (%) = %',
      NEW.total_price, NEW.price_per_night, v_nights, v_expected
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_offer_total_price ON public.offers;
CREATE TRIGGER trg_validate_offer_total_price
  BEFORE INSERT OR UPDATE OF total_price, price_per_night, request_id ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_offer_total_price();

-- 4) REQUESTS — rate limit: max 3 open requests per user.
CREATE OR REPLACE FUNCTION public.enforce_open_requests_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NEW.status = 'open' THEN
    SELECT count(*) INTO v_count
      FROM public.requests
      WHERE client_id = NEW.client_id AND status = 'open';
    IF v_count >= 3 THEN
      RAISE EXCEPTION 'Лимит открытых заявок: 3. Закройте старые перед созданием новых.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_open_requests_limit ON public.requests;
CREATE TRIGGER trg_enforce_open_requests_limit
  BEFORE INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_open_requests_limit();
