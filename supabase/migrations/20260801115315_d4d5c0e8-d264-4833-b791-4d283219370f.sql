ALTER TABLE public.watch_history
  ADD COLUMN IF NOT EXISTS position_seconds numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ep_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS srv_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS finished boolean NOT NULL DEFAULT false;