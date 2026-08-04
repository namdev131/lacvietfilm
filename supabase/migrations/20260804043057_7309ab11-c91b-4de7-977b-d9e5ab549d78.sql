CREATE TABLE IF NOT EXISTS public.watch_party_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(party_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.watch_party_members TO authenticated;
GRANT ALL ON public.watch_party_members TO service_role;

ALTER TABLE public.watch_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own memberships"
  ON public.watch_party_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage memberships"
  ON public.watch_party_members FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Realtime for members list if needed
ALTER TABLE public.watch_party_members REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'watch_party_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_members;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.create_watch_party(
  _slug text,
  _source text,
  _name text,
  _poster text DEFAULT NULL,
  _ep_index integer DEFAULT 0,
  _srv_index integer DEFAULT 0
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _party_id uuid;
  _code text;
  _attempt integer := 0;
  _alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF coalesce(trim(_slug), '') = '' OR coalesce(trim(_name), '') = '' THEN
    RAISE EXCEPTION 'Invalid movie';
  END IF;

  LOOP
    _attempt := _attempt + 1;
    SELECT string_agg(substr(_alphabet, 1 + floor(random() * length(_alphabet))::integer, 1), '')
      INTO _code
    FROM generate_series(1, 6);

    BEGIN
      INSERT INTO public.watch_parties (
        code, host_id, slug, source, name, poster, ep_index, srv_index
      ) VALUES (
        _code, auth.uid(), trim(_slug), coalesce(nullif(trim(_source), ''), 'kkphim'),
        trim(_name), _poster, greatest(_ep_index, 0), greatest(_srv_index, 0)
      )
      RETURNING id INTO _party_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF _attempt >= 10 THEN
        RAISE EXCEPTION 'Could not allocate party code';
      END IF;
    END;
  END LOOP;

  INSERT INTO public.watch_party_members (party_id, user_id)
  VALUES (_party_id, auth.uid())
  ON CONFLICT (party_id, user_id) DO NOTHING;

  RETURN _code;
END;
$$;

REVOKE ALL ON FUNCTION public.create_watch_party(text, text, text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_watch_party(text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_watch_party(text, text, text, text, integer, integer) TO service_role;

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

  SELECT id INTO _party_id
  FROM public.watch_parties
  WHERE code = upper(trim(_code))
    AND closed = false;

  IF _party_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.watch_party_members (party_id, user_id)
  VALUES (_party_id, auth.uid())
  ON CONFLICT (party_id, user_id) DO NOTHING;

  RETURN _party_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_party(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_party(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_party(text) TO service_role;
