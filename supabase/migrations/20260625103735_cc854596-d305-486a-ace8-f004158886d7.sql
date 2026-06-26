-- Fix notify_on_message to use the real `body` column
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE
  v_chat public.chats%ROWTYPE;
  v_recipient uuid;
BEGIN
  SELECT * INTO v_chat FROM public.chats WHERE id = NEW.chat_id;
  v_recipient := CASE WHEN NEW.sender_id = v_chat.client_id
                      THEN v_chat.owner_id ELSE v_chat.client_id END;
  INSERT INTO public.notifications(user_id, type, title, body, entity_type, entity_id)
  VALUES (v_recipient, 'message', 'Новое сообщение',
          LEFT(NEW.body, 80), 'chat', NEW.chat_id);
  RETURN NEW;
END $$;

-- Add 'alert' to notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'alert';

-- Harden become_landlord
CREATE OR REPLACE FUNCTION public.become_landlord()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;
  PERFORM set_config('app.allow_landlord_upgrade', 'true', true);
  UPDATE public.profiles SET is_landlord = true, mode = 'pro' WHERE id = auth.uid();
  PERFORM set_config('app.allow_landlord_upgrade', 'false', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.become_landlord() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.become_landlord() TO authenticated;

-- Bookings should only be created server-side via the accept-offer trigger
DROP POLICY IF EXISTS "Clients insert own bookings" ON public.bookings;