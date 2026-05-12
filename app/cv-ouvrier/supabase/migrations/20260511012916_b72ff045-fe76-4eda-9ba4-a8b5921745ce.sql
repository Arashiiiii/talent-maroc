
CREATE TABLE public.cvs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mon CV',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  template TEXT NOT NULL DEFAULT 'corso',
  accent TEXT NOT NULL DEFAULT '#7c3aed',
  lang TEXT NOT NULL DEFAULT 'fr',
  section_order JSONB NOT NULL DEFAULT '["summary","experience","education","skills","languages","certifications","projects","interests"]'::jsonb,
  sections_enabled JSONB NOT NULL DEFAULT '{"summary":true,"experience":true,"education":true,"skills":true,"languages":true,"certifications":false,"projects":false,"interests":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own CVs"
  ON public.cvs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CVs"
  ON public.cvs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CVs"
  ON public.cvs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CVs"
  ON public.cvs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX cvs_user_id_idx ON public.cvs(user_id);
