-- 1) view_events: only own rows readable
DROP POLICY IF EXISTS "view_events_select_any" ON public.view_events;
CREATE POLICY "view_events_select_own"
  ON public.view_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- leaderboard keeps working: aggregate-only function runs as definer
ALTER FUNCTION public.gold_board(text, text, integer) SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.gold_board(text, text, integer) TO anon, authenticated;

-- 2) watch party membership
CREATE TABLE IF NOT EXISTS public.watch_party_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (party_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.watch_party_members TO authenticated;
GRANT ALL ON public.watch_party_members TO service_role;
ALTER TABLE public.watch_party_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_party_member(_party_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.watch_parties p
    WHERE p.id = _party_id AND p.host_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.watch_party_members m
    WHERE m.party_id = _party_id AND m.user_id = _user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_party_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Members can view membership of their party" ON public.watch_party_members;
CREATE POLICY "Members can view membership of their party"
  ON public.watch_party_members FOR SELECT
  TO authenticated
  USING (public.is_party_member(party_id, auth.uid()));

DROP POLICY IF EXISTS "Users can leave their party" ON public.watch_party_members;
CREATE POLICY "Users can leave their party"
  ON public.watch_party_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- join by code (knowing the code is the invitation)
CREATE OR REPLACE FUNCTION public.join_party(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _party_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO _party_id FROM public.watch_parties WHERE code = upper(_code);
  IF _party_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.watch_party_members (party_id, user_id)
  VALUES (_party_id, auth.uid())
  ON CONFLICT (party_id, user_id) DO NOTHING;

  RETURN _party_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_party(text) TO authenticated;

-- 3) restrict party reads to host/members
DROP POLICY IF EXISTS "Authenticated can view open parties" ON public.watch_parties;
CREATE POLICY "Host or members can view party"
  ON public.watch_parties FOR SELECT
  TO authenticated
  USING (public.is_party_member(id, auth.uid()));

-- 4) restrict chat reads to host/members
DROP POLICY IF EXISTS "Authenticated can read party messages" ON public.watch_party_messages;
CREATE POLICY "Members can read party messages"
  ON public.watch_party_messages FOR SELECT
  TO authenticated
  USING (public.is_party_member(party_id, auth.uid()));