
-- Allow direct chats from a property listing (OLX-style), without an offer.
ALTER TABLE public.chats ALTER COLUMN offer_id DROP NOT NULL;
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_offer_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS chats_offer_id_uniq ON public.chats(offer_id) WHERE offer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS chats_direct_uniq
  ON public.chats(client_id, owner_id, property_id) WHERE offer_id IS NULL;

-- Get-or-create a direct chat between the signed-in user and a property owner.
CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(_property_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_client uuid := auth.uid();
  v_owner  uuid;
  v_chat   uuid;
BEGIN
  IF v_client IS NULL THEN
    RAISE EXCEPTION 'Auth required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT owner_id INTO v_owner FROM public.properties WHERE id = _property_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Property not found' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_owner = v_client THEN
    RAISE EXCEPTION 'Cannot chat with yourself' USING ERRCODE = 'check_violation';
  END IF;

  SELECT id INTO v_chat FROM public.chats
   WHERE client_id = v_client AND owner_id = v_owner
     AND property_id = _property_id AND offer_id IS NULL
   LIMIT 1;

  IF v_chat IS NULL THEN
    INSERT INTO public.chats(client_id, owner_id, property_id, offer_id)
    VALUES (v_client, v_owner, _property_id, NULL)
    RETURNING id INTO v_chat;
  END IF;

  RETURN v_chat;
END $$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_direct_chat(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_chat(uuid) TO authenticated;

-- Expose owner contact info attached to a listed (active) property.
-- Since properties are public listings, contact info follows the listing (OLX-style).
CREATE OR REPLACE FUNCTION public.get_property_contact(_property_id uuid)
RETURNS TABLE(phone text, whatsapp text, telegram text, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT pr.phone, pr.whatsapp, pr.telegram, pr.full_name
  FROM public.properties p
  JOIN public.profiles pr ON pr.id = p.owner_id
  WHERE p.id = _property_id AND p.status = 'active'
$$;

REVOKE EXECUTE ON FUNCTION public.get_property_contact(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_property_contact(uuid) TO authenticated, anon;
