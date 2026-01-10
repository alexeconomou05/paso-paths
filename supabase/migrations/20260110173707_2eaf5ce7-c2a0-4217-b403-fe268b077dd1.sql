-- Create table to track job notifications sent to students
CREATE TABLE public.job_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  job_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, job_id)
);

-- Enable RLS
ALTER TABLE public.job_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.job_notifications 
FOR SELECT 
USING (auth.uid() = student_id);

-- Service role can insert notifications (edge function)
CREATE POLICY "Service role can insert notifications" 
ON public.job_notifications 
FOR INSERT 
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_job_notifications_student ON public.job_notifications(student_id);
CREATE INDEX idx_job_notifications_job ON public.job_notifications(job_id);

-- Add email_notifications preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS job_notifications_enabled BOOLEAN DEFAULT true;