ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS episode_count INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_episode_dedupe
  ON public.notifications (user_id, slug, episode_count)
  WHERE episode_count IS NOT NULL;
