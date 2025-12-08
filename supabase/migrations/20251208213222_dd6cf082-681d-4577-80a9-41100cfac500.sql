-- Create employers table for company/employer profiles
CREATE TABLE public.employers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  company_website TEXT,
  company_description TEXT,
  logo_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;

-- Create policies for employer access
CREATE POLICY "Employers can view their own profile" 
ON public.employers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Employers can update their own profile" 
ON public.employers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Employers can insert their own profile" 
ON public.employers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all employers
CREATE POLICY "Admins can view all employers"
ON public.employers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all employers (for verification)
CREATE POLICY "Admins can update all employers"
ON public.employers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employers_updated_at
BEFORE UPDATE ON public.employers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();