CREATE TABLE public.shift_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_tasks TO authenticated;
GRANT ALL ON public.shift_tasks TO service_role;
ALTER TABLE public.shift_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shift tasks" ON public.shift_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_shift_tasks_upd BEFORE UPDATE ON public.shift_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.dashboard_assets (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('blend','diretriz')),
  path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_assets TO authenticated;
GRANT ALL ON public.dashboard_assets TO service_role;
ALTER TABLE public.dashboard_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dashboard assets" ON public.dashboard_assets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_dashboard_assets_upd BEFORE UPDATE ON public.dashboard_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "dashboard bucket read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dashboard' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "dashboard bucket insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dashboard' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "dashboard bucket update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'dashboard' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'dashboard' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "dashboard bucket delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dashboard' AND (storage.foldername(name))[1] = auth.uid()::text);