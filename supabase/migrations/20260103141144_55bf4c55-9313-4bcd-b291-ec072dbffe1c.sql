-- Add employer_id to link job postings to registered employers
ALTER TABLE public.job_postings 
ADD COLUMN employer_id UUID REFERENCES public.employers(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_job_postings_employer_id ON public.job_postings(employer_id);

-- Add policy for employers to update/delete their own job postings
CREATE POLICY "Employers can update their own job postings"
ON public.job_postings
FOR UPDATE
USING (
  employer_id IN (
    SELECT id FROM public.employers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employers can delete their own job postings"
ON public.job_postings
FOR DELETE
USING (
  employer_id IN (
    SELECT id FROM public.employers WHERE user_id = auth.uid()
  )
);