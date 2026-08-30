-- 1) WATCH PARTIES
CREATE TABLE public.watch_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  slug TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'kkphim',
  name TEXT NOT NULL,
  poster TEXT,
  ep_index INTEGER NOT NULL DEFAULT 0,
  srv_index INTEGER NOT NULL DEFAULT 0,
  position_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_parties TO authenticated;
GRANT ALL ON public.watch_parties TO service_role;

ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view open parties"
  ON public.watch_parties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own party"
  ON public.watch_parties FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update party"
  ON public.watch_parties FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can delete party"
  ON public.watch_parties FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- 2) CHAT MESSAGES
CREATE TABLE public.watch_party_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_party_messages TO authenticated;
GRANT ALL ON public.watch_party_messages TO service_role;

ALTER TABLE public.watch_party_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read party messages"
  ON public.watch_party_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can send their own messages"
  ON public.watch_party_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages"
  ON public.watch_party_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_wpm_party_created ON public.watch_party_messages (party_id, created_at);

-- 3) SERIES FOLLOWS
CREATE TABLE public.series_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  slug TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'kkphim',
  name TEXT NOT NULL,
  poster TEXT,
  known_episodes INTEGER NOT NULL DEFAULT 0,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.series_follows TO authenticated;
GRANT ALL ON public.series_follows TO service_role;

ALTER TABLE public.series_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own follows"
  ON public.series_follows FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4) NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  slug TEXT,
  source TEXT,
  poster TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, created_at DESC);

-- 5) updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_watch_parties_updated_at BEFORE UPDATE ON public.watch_parties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wpm_updated_at BEFORE UPDATE ON public.watch_party_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_series_follows_updated_at BEFORE UPDATE ON public.series_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Realtime
ALTER TABLE public.watch_parties REPLICA IDENTITY FULL;
ALTER TABLE public.watch_party_messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_parties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

ALTER TABLE public.watch_parties
  ADD COLUMN IF NOT EXISTS chat_mode TEXT NOT NULL DEFAULT 'all'
  CHECK (chat_mode IN ('all', 'host'));

DROP POLICY IF EXISTS "Users can send their own messages" ON public.watch_party_messages;
CREATE POLICY "Users can send messages when chat allowed"
  ON public.watch_party_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.watch_parties p
      WHERE p.id = party_id
        AND p.closed = false
        AND (p.chat_mode = 'all' OR p.host_id = auth.uid())
    )
  );

CREATE POLICY "Host can delete messages in own party"
  ON public.watch_party_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.watch_parties p WHERE p.id = party_id AND p.host_id = auth.uid()));

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
