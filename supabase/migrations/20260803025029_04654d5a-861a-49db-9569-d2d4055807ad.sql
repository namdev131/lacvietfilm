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