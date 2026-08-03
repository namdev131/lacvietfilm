-- Restrict raw ratings reads to the owner
DROP POLICY IF EXISTS "ratings readable by everyone" ON public.movie_ratings;

CREATE POLICY "own rating select"
  ON public.movie_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE SELECT ON public.movie_ratings FROM anon;

-- Public aggregate-only summary (no user_id exposed)
CREATE OR REPLACE FUNCTION public.rating_summary(_slug text)
RETURNS TABLE(avg numeric, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(round(avg(r.score)::numeric, 2), 0) AS avg,
         count(*)::bigint AS count
  FROM public.movie_ratings r
  WHERE r.slug = _slug;
$$;

GRANT EXECUTE ON FUNCTION public.rating_summary(text) TO anon, authenticated;