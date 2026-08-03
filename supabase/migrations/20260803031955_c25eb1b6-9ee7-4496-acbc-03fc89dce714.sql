ALTER TABLE public.watch_parties
  ADD COLUMN IF NOT EXISTS chat_mode TEXT NOT NULL DEFAULT 'all'
  CHECK (chat_mode IN ('all', 'host'));

DROP POLICY IF EXISTS "Users can send their own messages" ON public.watch_party_messages;
CREATE POLICY "Users can send messages when chat allowed"
  ON public.watch_party_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.watch_parties p
      WHERE p.id = party_id
        AND p.closed = false
        AND (p.chat_mode = 'all' OR p.host_id = auth.uid())
    )
  );

CREATE POLICY "Host can delete messages in own party"
  ON public.watch_party_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.watch_parties p WHERE p.id = party_id AND p.host_id = auth.uid()));