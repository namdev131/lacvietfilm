CREATE TABLE IF NOT EXISTS public.watch_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  source text NOT NULL DEFAULT 'kkphim',
  name text NOT NULL,
  poster text,
  ep_index integer NOT NULL DEFAULT 0,
  srv_index integer NOT NULL DEFAULT 0,
  position_seconds double precision NOT NULL DEFAULT 0,
  is_playing boolean NOT NULL DEFAULT false,
  closed boolean NOT NULL DEFAULT false,
  chat_mode text NOT NULL DEFAULT 'all' CHECK (chat_mode IN ('all','host')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.watch_party_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.watch_party_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(party_id,user_id)
);

CREATE INDEX IF NOT EXISTS idx_wpm_party_created ON public.watch_party_messages(party_id,created_at);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.watch_parties TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.watch_party_messages TO authenticated;
GRANT SELECT,INSERT,DELETE ON public.watch_party_members TO authenticated;
GRANT ALL ON public.watch_parties,public.watch_party_messages,public.watch_party_members TO service_role;
ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view open parties" ON public.watch_parties;
CREATE POLICY "Authenticated can view open parties" ON public.watch_parties FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can create their own party" ON public.watch_parties;
CREATE POLICY "Users can create their own party" ON public.watch_parties FOR INSERT TO authenticated WITH CHECK (auth.uid()=host_id);
DROP POLICY IF EXISTS "Host can update party" ON public.watch_parties;
CREATE POLICY "Host can update party" ON public.watch_parties FOR UPDATE TO authenticated USING (auth.uid()=host_id) WITH CHECK (auth.uid()=host_id);
DROP POLICY IF EXISTS "Host can delete party" ON public.watch_parties;
CREATE POLICY "Host can delete party" ON public.watch_parties FOR DELETE TO authenticated USING (auth.uid()=host_id);
DROP POLICY IF EXISTS "Authenticated can read party messages" ON public.watch_party_messages;
CREATE POLICY "Authenticated can read party messages" ON public.watch_party_messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can send messages when chat allowed" ON public.watch_party_messages;
CREATE POLICY "Users can send messages when chat allowed" ON public.watch_party_messages FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id AND EXISTS (SELECT 1 FROM public.watch_parties p WHERE p.id=party_id AND NOT p.closed AND (p.chat_mode='all' OR p.host_id=auth.uid())));
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.watch_party_messages;
CREATE POLICY "Users can delete their own messages" ON public.watch_party_messages FOR DELETE TO authenticated USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "Host can delete messages in own party" ON public.watch_party_messages;
CREATE POLICY "Host can delete messages in own party" ON public.watch_party_messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.watch_parties p WHERE p.id=party_id AND p.host_id=auth.uid()));
DROP POLICY IF EXISTS "Members can view their own memberships" ON public.watch_party_members;
CREATE POLICY "Members can view their own memberships" ON public.watch_party_members FOR SELECT TO authenticated USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "System can manage memberships" ON public.watch_party_members;
CREATE POLICY "System can manage memberships" ON public.watch_party_members FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.create_watch_party(_slug text,_source text,_name text,_poster text DEFAULT NULL,_ep_index integer DEFAULT 0,_srv_index integer DEFAULT 0)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _party_id uuid; _code text; _attempt integer:=0; _alphabet constant text:='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF coalesce(trim(_slug),'')='' OR coalesce(trim(_name),'')='' THEN RAISE EXCEPTION 'Invalid movie'; END IF;
  LOOP
    _attempt:=_attempt+1;
    SELECT string_agg(substr(_alphabet,1+floor(random()*length(_alphabet))::integer,1),'') INTO _code FROM generate_series(1,6);
    BEGIN
      INSERT INTO public.watch_parties(code,host_id,slug,source,name,poster,ep_index,srv_index)
      VALUES(_code,auth.uid(),trim(_slug),coalesce(nullif(trim(_source),''),'kkphim'),trim(_name),_poster,greatest(_ep_index,0),greatest(_srv_index,0)) RETURNING id INTO _party_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN IF _attempt>=10 THEN RAISE EXCEPTION 'Could not allocate party code'; END IF;
    END;
  END LOOP;
  INSERT INTO public.watch_party_members(party_id,user_id) VALUES(_party_id,auth.uid()) ON CONFLICT(party_id,user_id) DO NOTHING;
  RETURN _code;
END; $$;

CREATE OR REPLACE FUNCTION public.join_party(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _party_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO _party_id FROM public.watch_parties WHERE code=upper(trim(_code)) AND NOT closed;
  IF _party_id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.watch_party_members(party_id,user_id) VALUES(_party_id,auth.uid()) ON CONFLICT(party_id,user_id) DO NOTHING;
  RETURN _party_id;
END; $$;

REVOKE ALL ON FUNCTION public.create_watch_party(text,text,text,text,integer,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.join_party(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_watch_party(text,text,text,text,integer,integer) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.join_party(text) TO authenticated,service_role;

ALTER TABLE public.watch_parties REPLICA IDENTITY FULL;
ALTER TABLE public.watch_party_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='watch_parties') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_parties; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='watch_party_messages') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_messages; END IF;
END $$;
NOTIFY pgrst,'reload schema';
