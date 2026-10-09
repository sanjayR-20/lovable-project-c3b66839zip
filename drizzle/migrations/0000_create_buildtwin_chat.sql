CREATE TABLE public.buildtwin_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New site review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buildtwin_threads TO authenticated;
GRANT ALL ON public.buildtwin_threads TO service_role;
ALTER TABLE public.buildtwin_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their BuildTwin conversations" ON public.buildtwin_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their BuildTwin conversations" ON public.buildtwin_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their BuildTwin conversations" ON public.buildtwin_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their BuildTwin conversations" ON public.buildtwin_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX buildtwin_threads_user_updated_idx ON public.buildtwin_threads (user_id, updated_at DESC);

CREATE TABLE public.buildtwin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.buildtwin_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ai_message_id TEXT,
  message JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buildtwin_messages TO authenticated;
GRANT ALL ON public.buildtwin_messages TO service_role;
ALTER TABLE public.buildtwin_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their BuildTwin messages" ON public.buildtwin_messages FOR SELECT TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.buildtwin_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can add their BuildTwin messages" ON public.buildtwin_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.buildtwin_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can update their BuildTwin messages" ON public.buildtwin_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.buildtwin_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.buildtwin_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can delete their BuildTwin messages" ON public.buildtwin_messages FOR DELETE TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.buildtwin_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE INDEX buildtwin_messages_thread_created_idx ON public.buildtwin_messages (thread_id, created_at ASC);