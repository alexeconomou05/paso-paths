CREATE OR REPLACE FUNCTION public.get_job_applicant_count(_job_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT COUNT(*)::int
    FROM public.applications a
    JOIN public.job_postings j ON j.id = a.job_id
    WHERE a.job_id = _job_id
      AND j.employer_id IS NOT NULL
  ), 0);
$$;

REVOKE EXECUTE ON FUNCTION public.get_job_applicant_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_job_applicant_count(uuid) TO authenticated;