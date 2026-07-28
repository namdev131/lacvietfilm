GRANT SELECT, INSERT ON public.view_events TO anon;
GRANT SELECT, INSERT ON public.view_events TO authenticated;
GRANT ALL ON public.view_events TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_history TO authenticated;
GRANT ALL ON public.watch_history TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

GRANT EXECUTE ON FUNCTION public.gold_board(text, text, integer) TO anon, authenticated;