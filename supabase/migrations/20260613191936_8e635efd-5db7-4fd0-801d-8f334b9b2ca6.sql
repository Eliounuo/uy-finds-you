
-- =========================================
-- PROPERTIES
-- =========================================
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  city text NOT NULL,
  district text,
  address text,
  lat numeric,
  lng numeric,
  price_per_night integer NOT NULL CHECK (price_per_night >= 0),
  currency text NOT NULL DEFAULT 'KZT',
  rooms integer DEFAULT 1,
  beds integer DEFAULT 1,
  guests integer DEFAULT 2,
  area integer,
  amenities text[] NOT NULL DEFAULT '{}',
  photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','draft')),
  rating numeric NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_city_status ON public.properties(city, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT ON public.properties TO anon;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active properties visible to all"
  ON public.properties FOR SELECT
  USING (status = 'active' OR owner_id = auth.uid());

CREATE POLICY "Owners insert own properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update own properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete own properties"
  ON public.properties FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- REQUESTS
-- =========================================
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city text NOT NULL,
  district text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL DEFAULT 2,
  budget_max integer NOT NULL,
  notes text,
  amenities text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  CHECK (check_out > check_in)
);
CREATE INDEX idx_requests_client ON public.requests(client_id);
CREATE INDEX idx_requests_open ON public.requests(status, city) WHERE status = 'open';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated see open requests or own"
  ON public.requests FOR SELECT TO authenticated
  USING (status = 'open' OR client_id = auth.uid());

CREATE POLICY "Clients insert own requests"
  ON public.requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients update own requests"
  ON public.requests FOR UPDATE TO authenticated
  USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients delete own requests"
  ON public.requests FOR DELETE TO authenticated
  USING (auth.uid() = client_id);

-- =========================================
-- OFFERS
-- =========================================
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_per_night integer NOT NULL,
  total_price integer NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, property_id)
);
CREATE INDEX idx_offers_request ON public.offers(request_id);
CREATE INDEX idx_offers_owner ON public.offers(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Helper: is current user the client of the parent request?
CREATE OR REPLACE FUNCTION public.is_request_client(_request_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.requests WHERE id = _request_id AND client_id = _user_id)
$$;

CREATE POLICY "Owner or request client see offer"
  ON public.offers FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_request_client(request_id, auth.uid()));

CREATE POLICY "Owners insert own offers"
  ON public.offers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner or request client update offer"
  ON public.offers FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_request_client(request_id, auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.is_request_client(request_id, auth.uid()));

-- =========================================
-- BOOKINGS
-- =========================================
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL,
  total_price integer NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_client ON public.bookings(client_id);
CREATE INDEX idx_bookings_owner ON public.bookings(owner_id);
CREATE INDEX idx_bookings_property_dates ON public.bookings(property_id, check_in, check_out);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants see booking"
  ON public.bookings FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Participants update booking"
  ON public.bookings FOR UPDATE TO authenticated
  USING (client_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (client_id = auth.uid() OR owner_id = auth.uid());

-- =========================================
-- CHATS
-- =========================================
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id)
);
CREATE INDEX idx_chats_client ON public.chats(client_id, last_message_at DESC);
CREATE INDEX idx_chats_owner ON public.chats(owner_id, last_message_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO authenticated;
GRANT ALL ON public.chats TO service_role;

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants see chat"
  ON public.chats FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Participants update chat"
  ON public.chats FOR UPDATE TO authenticated
  USING (client_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (client_id = auth.uid() OR owner_id = auth.uid());

-- =========================================
-- MESSAGES
-- =========================================
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_chat ON public.messages(chat_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_chat_participant(_chat_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chats
    WHERE id = _chat_id AND (client_id = _user_id OR owner_id = _user_id)
  )
$$;

CREATE POLICY "Participants see messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_chat_participant(chat_id, auth.uid()));

CREATE POLICY "Participants insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_chat_participant(chat_id, auth.uid()));

-- Bump chat last_message_at on insert
CREATE OR REPLACE FUNCTION public.bump_chat_last_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chats SET last_message_at = NEW.created_at WHERE id = NEW.chat_id;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_bump_chat_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_chat_last_message();

-- =========================================
-- REVIEWS
-- =========================================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, author_id)
);
CREATE INDEX idx_reviews_property ON public.reviews(property_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews visible to all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Author insert review" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author update review" ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author delete review" ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- =========================================
-- FAVORITES
-- =========================================
CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own favorites" ON public.favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users add own favorites" ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own favorites" ON public.favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================================
-- AUTO BOOKING + CHAT ON OFFER ACCEPT
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_offer_accepted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.requests%ROWTYPE;
  v_booking_id uuid;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    SELECT * INTO v_req FROM public.requests WHERE id = NEW.request_id;

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

CREATE TRIGGER trg_handle_offer_accepted
  AFTER UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.handle_offer_accepted();

-- =========================================
-- REALTIME
-- =========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
