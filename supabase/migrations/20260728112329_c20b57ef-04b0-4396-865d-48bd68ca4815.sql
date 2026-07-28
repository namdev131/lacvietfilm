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
SECURITY INVOKER
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
    SELECT v.slug,
           (array_agg(v.name ORDER BY v.created_at DESC))[1] AS name,
           (array_agg(v.poster ORDER BY v.created_at DESC))[1] AS poster,
           (array_agg(v.source ORDER BY v.created_at DESC))[1] AS source,
           (array_agg(v.kind ORDER BY v.created_at DESC))[1] AS kind,
           count(*) AS views
    FROM public.view_events v, span s
    WHERE v.created_at > now() - s.len
      AND (_kind = 'all' OR v.kind = _kind)
    GROUP BY v.slug
  ),
  prev AS (
    SELECT v.slug, count(*) AS views
    FROM public.view_events v, span s
    WHERE v.created_at > now() - s.len * 2
      AND v.created_at <= now() - s.len
      AND (_kind = 'all' OR v.kind = _kind)
    GROUP BY v.slug
  ),
  cur_ranked AS (
    SELECT c.*, rank() OVER (ORDER BY c.views DESC, c.slug)::int AS rank FROM cur c
  ),
  prev_ranked AS (
    SELECT p.slug, rank() OVER (ORDER BY p.views DESC, p.slug)::int AS prev_rank FROM prev p
  )
  SELECT c.slug, c.name, c.poster, c.source, c.kind, c.views, c.rank, pr.prev_rank
  FROM cur_ranked c
  LEFT JOIN prev_ranked pr ON pr.slug = c.slug
  ORDER BY c.rank
  LIMIT _limit;
$$;