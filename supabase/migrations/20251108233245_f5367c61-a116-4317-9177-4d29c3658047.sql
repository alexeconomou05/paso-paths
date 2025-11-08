-- Create enum for verification status
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for employment type
CREATE TYPE employment_type AS ENUM ('internship', 'part_time', 'full_time', 'graduate_program');

-- Create enum for application status
CREATE TYPE application_status AS ENUM ('submitted', 'reviewing', 'accepted', 'rejected');

-- Create profiles table for students
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  university TEXT,
  field_of_study TEXT,
  graduation_year INTEGER,
  bio TEXT,
  photo_url TEXT,
  cv_url TEXT,
  paso_number TEXT,
  paso_document_url TEXT,
  verification_status verification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create job_postings table
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_name TEXT NOT NULL,
  employer_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  employment_type employment_type NOT NULL,
  requirements TEXT,
  location TEXT,
  salary_range TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status application_status DEFAULT 'submitted',
  cover_letter TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, student_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all verified profiles"
  ON public.profiles FOR SELECT
  USING (verification_status = 'approved');

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Job postings policies (public read for now, can be refined later)
CREATE POLICY "Anyone can view active job postings"
  ON public.job_postings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create job postings"
  ON public.job_postings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Applications policies
CREATE POLICY "Students can view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Verified students can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    auth.uid() = student_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND verification_status = 'approved'
    )
  );

-- Create storage buckets for CVs and PASO documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cvs', 'cvs', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('paso-documents', 'paso-documents', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

-- Storage policies for CVs
CREATE POLICY "Users can upload own CV"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cvs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own CV"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cvs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own CV"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cvs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for PASO documents
CREATE POLICY "Users can upload own PASO document"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'paso-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own PASO document"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'paso-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for profile photos
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own profile photo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();