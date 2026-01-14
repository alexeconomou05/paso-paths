-- Add filter preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS job_filter_preferences jsonb DEFAULT '{}'::jsonb;