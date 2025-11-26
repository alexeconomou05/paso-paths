-- Add external_url field to job_postings table
ALTER TABLE public.job_postings 
ADD COLUMN external_url TEXT;