ALTER TABLE public.view_events
  ADD COLUMN IF NOT EXISTS movie_key text;

UPDATE public.view_events
SET movie_key = regexp_replace(
  translate(lower(name),
    'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ',
    'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyy'),
  '[^a-z0-9]', '', 'g')
WHERE movie_key IS NULL OR movie_key = '';

ALTER TABLE public.view_events
  ALTER COLUMN movie_key SET NOT NULL;

CREATE INDEX IF NOT EXISTS view_events_movie_key_idx
  ON public.view_events (movie_key);

CREATE OR REPLACE FUNCTION public.gold_board(_period text DEFAULT 'day', _kind text DEFAULT 'all', _limit int DEFAULT 10)
RETURNS TABLE (
  slug text,
  name text,
  poster text,
  source text,
  kind text,
  views bigint,
  rank int,
  prev_rank int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH span AS (
    SELECT CASE _period
      WHEN 'day' THEN interval '1 day'
      WHEN 'week' THEN interval '7 days'
      WHEN 'month' THEN interval '30 days'
      ELSE interval '100 years'
    END AS len
  ),
  cur AS (
    SELECT v.movie_key,
           (array_agg(v.slug ORDER BY v.created_at DESC))[1] AS slug,
           (array_agg(v.name ORDER BY v.created_at DESC))[1] AS name,
           (array_agg(v.poster ORDER BY v.created_at DESC))[1] AS poster,
           (array_agg(v.source ORDER BY v.created_at DESC))[1] AS source,
           (array_agg(v.kind ORDER BY v.created_at DESC))[1] AS kind,
           count(*) AS views
    FROM public.view_events v, span s
    WHERE v.created_at > now() - s.len
      AND (_kind = 'all' OR v.kind = _kind)
    GROUP BY v.movie_key
  ),
  prev AS (
    SELECT v.movie_key, count(*) AS views
    FROM public.view_events v, span s
    WHERE v.created_at > now() - s.len * 2
      AND v.created_at <= now() - s.len
      AND (_kind = 'all' OR v.kind = _kind)
    GROUP BY v.movie_key
  ),
  cur_ranked AS (
    SELECT c.*, rank() OVER (ORDER BY c.views DESC, c.movie_key)::int AS rank FROM cur c
  ),
  prev_ranked AS (
    SELECT p.movie_key, rank() OVER (ORDER BY p.views DESC, p.movie_key)::int AS prev_rank FROM prev p
  )
  SELECT c.slug, c.name, c.poster, c.source, c.kind, c.views, c.rank, p.prev_rank
  FROM cur_ranked c
  LEFT JOIN prev_ranked p ON p.movie_key = c.movie_key
  ORDER BY c.rank
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.gold_board(text, text, int) TO anon, authenticated, service_role;
