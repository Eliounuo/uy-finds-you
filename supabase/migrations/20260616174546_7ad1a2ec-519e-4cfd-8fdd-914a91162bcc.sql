
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('unverified','pending','verified','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.complaint_target AS ENUM ('property','owner','client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.complaint_status AS ENUM ('open','reviewing','resolved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'message','offer_new','offer_accepted','offer_declined',
    'booking_created','booking_cancelled','verification_update'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ USER ROLES ============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user can see own roles" ON public.user_roles;
CREATE POLICY "user can see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- ============ PROFILES extensions ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS global_user_id uuid UNIQUE;

-- Default global_user_id = id for existing rows; new rows fill in trigger
UPDATE public.profiles SET global_user_id = id WHERE global_user_id IS NULL;

CREATE OR REPLACE FUNCTION public.set_global_user_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.global_user_id IS NULL THEN NEW.global_user_id := NEW.id; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_profiles_global_user_id ON public.profiles;
CREATE TRIGGER trg_profiles_global_user_id BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_global_user_id();

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user reads own notifications" ON public.notifications;
CREATE POLICY "user reads own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "user marks own notifications" ON public.notifications;
CREATE POLICY "user marks own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Triggers to insert notifications
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_chat public.chats%ROWTYPE;
  v_recipient uuid;
BEGIN
  SELECT * INTO v_chat FROM public.chats WHERE id = NEW.chat_id;
  v_recipient := CASE WHEN NEW.sender_id = v_chat.client_id THEN v_chat.owner_id ELSE v_chat.client_id END;
  INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
  VALUES (v_recipient, 'message', 'Новое сообщение', LEFT(NEW.content, 80), 'chat', NEW.chat_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_on_message ON public.messages;
CREATE TRIGGER trg_notify_on_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

CREATE OR REPLACE FUNCTION public.notify_on_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid;
BEGIN
  SELECT client_id INTO v_client FROM public.requests WHERE id = NEW.request_id;
  INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
  VALUES (v_client, 'offer_new', 'Новое предложение', 'Владелец прислал предложение по вашей заявке', 'offer', NEW.id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_on_offer ON public.offers;
CREATE TRIGGER trg_notify_on_offer AFTER INSERT ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_on_offer();

CREATE OR REPLACE FUNCTION public.notify_on_offer_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
    VALUES (NEW.owner_id, 'offer_accepted', 'Ваше предложение принято', 'Клиент принял ваше предложение', 'offer', NEW.id);
  ELSIF NEW.status = 'declined' AND OLD.status IS DISTINCT FROM 'declined' THEN
    INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
    VALUES (NEW.owner_id, 'offer_declined', 'Предложение отклонено', 'Клиент отклонил ваше предложение', 'offer', NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_on_offer_status ON public.offers;
CREATE TRIGGER trg_notify_on_offer_status AFTER UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_on_offer_status();

CREATE OR REPLACE FUNCTION public.notify_on_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
    VALUES (NEW.client_id, 'booking_created', 'Бронь подтверждена', 'Заезд ' || NEW.check_in::text, 'booking', NEW.id);
    INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
    VALUES (NEW.owner_id, 'booking_created', 'Новая бронь', 'Заезд ' || NEW.check_in::text, 'booking', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
    VALUES (NEW.client_id, 'booking_cancelled', 'Бронь отменена', NULL, 'booking', NEW.id);
    INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
    VALUES (NEW.owner_id, 'booking_cancelled', 'Бронь отменена', NULL, 'booking', NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_on_booking_ins ON public.bookings;
CREATE TRIGGER trg_notify_on_booking_ins AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking();
DROP TRIGGER IF EXISTS trg_notify_on_booking_upd ON public.bookings;
CREATE TRIGGER trg_notify_on_booking_upd AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking();

-- ============ COMPLAINTS ============
CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.complaint_target NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status public.complaint_status NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_complaints_reporter ON public.complaints(reporter_id);
CREATE INDEX IF NOT EXISTS idx_complaints_target ON public.complaints(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reporter sees own complaints" ON public.complaints;
CREATE POLICY "reporter sees own complaints" ON public.complaints
  FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "users insert complaints" ON public.complaints;
CREATE POLICY "users insert complaints" ON public.complaints
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS "admin updates complaints" ON public.complaints;
CREATE POLICY "admin updates complaints" ON public.complaints
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_complaints_updated_at ON public.complaints;
CREATE TRIGGER trg_complaints_updated_at BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ VERIFICATION REQUESTS ============
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_url text NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verif_user ON public.verification_requests(user_id);
GRANT SELECT, INSERT ON public.verification_requests TO authenticated;
GRANT UPDATE ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user sees own verif" ON public.verification_requests;
CREATE POLICY "user sees own verif" ON public.verification_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "user inserts own verif" ON public.verification_requests;
CREATE POLICY "user inserts own verif" ON public.verification_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "admin updates verif" ON public.verification_requests;
CREATE POLICY "admin updates verif" ON public.verification_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_verif_updated_at ON public.verification_requests;
CREATE TRIGGER trg_verif_updated_at BEFORE UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Propagate approved verification to profile + notify user
CREATE OR REPLACE FUNCTION public.on_verification_decided()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('verified','rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.profiles SET verification_status = NEW.status WHERE id = NEW.user_id;
    INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
    VALUES (NEW.user_id, 'verification_update',
      CASE WHEN NEW.status='verified' THEN 'Профиль верифицирован' ELSE 'Верификация отклонена' END,
      NEW.review_note, 'verification_request', NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_on_verification_decided ON public.verification_requests;
CREATE TRIGGER trg_on_verification_decided AFTER UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.on_verification_decided();

-- ============ RATING VIEWS ============
CREATE OR REPLACE VIEW public.property_ratings AS
SELECT property_id,
       ROUND(AVG(rating)::numeric, 2) AS avg_rating,
       COUNT(*)::int AS reviews_count
FROM public.reviews
GROUP BY property_id;
GRANT SELECT ON public.property_ratings TO anon, authenticated;

CREATE OR REPLACE VIEW public.owner_ratings AS
SELECT p.owner_id,
       ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
       COUNT(*)::int AS reviews_count
FROM public.reviews r
JOIN public.properties p ON p.id = r.property_id
GROUP BY p.owner_id;
GRANT SELECT ON public.owner_ratings TO anon, authenticated;

-- Function: can current user review this booking
CREATE OR REPLACE FUNCTION public.can_review_booking(_booking_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.bookings b
    WHERE b.id = _booking_id
      AND b.client_id = auth.uid()
      AND b.check_out <= CURRENT_DATE
      AND b.status IN ('confirmed','completed')
  ) AND NOT EXISTS(
    SELECT 1 FROM public.reviews r WHERE r.booking_id = _booking_id AND r.author_id = auth.uid()
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_review_booking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_review_booking(uuid) TO authenticated;
