CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.movie_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  source text NOT NULL DEFAULT 'kkphim',
  name text NOT NULL DEFAULT '',
  poster text,
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
GRANT SELECT ON public.movie_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movie_ratings TO authenticated;
GRANT ALL ON public.movie_ratings TO service_role;
ALTER TABLE public.movie_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings readable by everyone" ON public.movie_ratings FOR SELECT USING (true);
CREATE POLICY "own rating insert" ON public.movie_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rating update" ON public.movie_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rating delete" ON public.movie_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX movie_ratings_slug_idx ON public.movie_ratings (slug);

CREATE TABLE public.movie_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  source text NOT NULL DEFAULT 'kkphim',
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  parent_id uuid REFERENCES public.movie_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.movie_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movie_comments TO authenticated;
GRANT ALL ON public.movie_comments TO service_role;
ALTER TABLE public.movie_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments readable by everyone" ON public.movie_comments FOR SELECT USING (true);
CREATE POLICY "own comment insert" ON public.movie_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own comment update" ON public.movie_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own comment delete" ON public.movie_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX movie_comments_slug_idx ON public.movie_comments (slug, created_at DESC);

CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text,
  cover text,
  is_public boolean NOT NULL DEFAULT false,
  share_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public or own collections readable" ON public.collections FOR SELECT USING (is_public OR auth.uid() = user_id);
CREATE POLICY "own collection insert" ON public.collections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own collection update" ON public.collections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own collection delete" ON public.collections FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  poster text,
  source text NOT NULL DEFAULT 'kkphim',
  note text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, slug)
);
GRANT SELECT ON public.collection_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT ALL ON public.collection_items TO service_role;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items of visible collections readable" ON public.collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_public OR c.user_id = auth.uid()))
);
CREATE POLICY "own item insert" ON public.collection_items FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);
CREATE POLICY "own item update" ON public.collection_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own item delete" ON public.collection_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER movie_ratings_updated BEFORE UPDATE ON public.movie_ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER movie_comments_updated BEFORE UPDATE ON public.movie_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER collections_updated BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();