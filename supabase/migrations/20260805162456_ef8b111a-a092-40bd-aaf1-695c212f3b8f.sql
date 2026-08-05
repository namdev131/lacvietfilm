CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.cleanup_watch_parties()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ids uuid[];
  _n integer;
BEGIN
  SELECT array_agg(id) INTO _ids
  FROM public.watch_parties
  WHERE (closed = true AND updated_at < now() - interval '30 minutes')
     OR (updated_at < now() - interval '12 hours');

  IF _ids IS NULL THEN
    RETURN 0;
  END IF;

  DELETE FROM public.watch_party_messages WHERE party_id = ANY(_ids);
  DELETE FROM public.watch_party_members WHERE party_id = ANY(_ids);
  DELETE FROM public.watch_parties WHERE id = ANY(_ids);

  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_watch_parties() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_watch_parties() TO service_role;