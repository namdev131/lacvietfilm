ALTER TABLE public.movie_ratings
  ADD COLUMN IF NOT EXISTS review text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'visible';

UPDATE public.movie_ratings SET score = 5 WHERE score > 5;
ALTER TABLE public.movie_ratings DROP CONSTRAINT IF EXISTS movie_ratings_score_check;
ALTER TABLE public.movie_ratings DROP CONSTRAINT IF EXISTS movie_ratings_review_check;
ALTER TABLE public.movie_ratings DROP CONSTRAINT IF EXISTS movie_ratings_status_check;
ALTER TABLE public.movie_ratings ADD CONSTRAINT movie_ratings_score_check CHECK (score BETWEEN 1 AND 5);
ALTER TABLE public.movie_ratings ADD CONSTRAINT movie_ratings_review_check CHECK (review IS NULL OR char_length(review) <= 1000);
ALTER TABLE public.movie_ratings ADD CONSTRAINT movie_ratings_status_check CHECK (status IN ('visible', 'hidden'));

CREATE OR REPLACE FUNCTION public.enforce_movie_ratings_cooldown()
RETURNS trigger AS $$
BEGIN
  IF OLD.updated_at > now() - interval '60 seconds' THEN
    RAISE EXCEPTION 'Vui lòng chờ 60 giây trước khi cập nhật' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS movie_ratings_cooldown ON public.movie_ratings;
CREATE TRIGGER movie_ratings_cooldown BEFORE UPDATE ON public.movie_ratings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_movie_ratings_cooldown();

DROP POLICY IF EXISTS "ratings readable by everyone" ON public.movie_ratings;
CREATE POLICY "visible or own ratings readable" ON public.movie_ratings
  FOR SELECT USING (status = 'visible' OR auth.uid() = user_id);

-- Writes go through /api/ratings so clients cannot bypass validation or cooldown.
REVOKE INSERT, UPDATE, DELETE ON public.movie_ratings FROM authenticated;
DROP POLICY IF EXISTS "own rating insert" ON public.movie_ratings;
DROP POLICY IF EXISTS "own rating update" ON public.movie_ratings;
DROP POLICY IF EXISTS "own rating delete" ON public.movie_ratings;

CREATE INDEX IF NOT EXISTS movie_ratings_visible_latest_idx
  ON public.movie_ratings (slug, updated_at DESC) WHERE status = 'visible';
