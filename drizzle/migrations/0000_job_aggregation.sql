ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'gohire',
  ADD COLUMN IF NOT EXISTS source_job_id text,
  ADD COLUMN IF NOT EXISTS posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS content_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS job_postings_source_job_uidx
  ON public.job_postings (source, source_job_id) WHERE source_job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS job_postings_external_url_idx ON public.job_postings (external_url);
CREATE INDEX IF NOT EXISTS job_postings_source_seen_idx ON public.job_postings (source, last_seen_at);

CREATE TABLE public.job_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  trigger text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  found integer NOT NULL DEFAULT 0,
  inserted integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  expired integer NOT NULL DEFAULT 0,
  error text
);
GRANT SELECT ON public.job_import_runs TO authenticated;
GRANT ALL ON public.job_import_runs TO service_role;
ALTER TABLE public.job_import_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view import runs" ON public.job_import_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));