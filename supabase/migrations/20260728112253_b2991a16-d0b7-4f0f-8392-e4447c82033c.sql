CREATE TABLE public.view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  slug text NOT NULL,
  name text NOT NULL,
  poster text,
  source text NOT NULL DEFAULT 'kkphim',
  kind text NOT NULL DEFAULT 'other',
  lang text NOT NULL DEFAULT 'vietsub',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX view_events_created_at_idx ON public.view_events (created_at DESC);
CREATE INDEX view_events_slug_idx ON public.view_events (slug);

GRANT SELECT, INSERT ON public.view_events TO anon;
GRANT SELECT, INSERT ON public.view_events TO authenticated;
GRANT ALL ON public.view_events TO service_role;

ALTER TABLE public.view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY view_events_insert_any ON public.view_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY view_events_select_any ON public.view_events
  FOR SELECT TO anon, authenticated
  USING (true);

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

GRANT EXECUTE ON FUNCTION public.gold_board(text, text, int) TO anon, authenticated, service_role;

ALTER PUBLICATION supabase_realtime ADD TABLE public.view_events;