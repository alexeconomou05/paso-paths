-- Add career interests field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS career_interests TEXT;

-- Add column for storing preferred job types
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_employment_types TEXT[];

COMMENT ON COLUMN public.profiles.career_interests IS 'Student dream role and career aspirations';
COMMENT ON COLUMN public.profiles.preferred_employment_types IS 'Array of preferred employment types (internship, part_time, full_time, graduate_program)';