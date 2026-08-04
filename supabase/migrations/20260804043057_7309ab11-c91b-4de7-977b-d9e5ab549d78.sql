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