import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Link, FileText, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { z } from "zod";

const jobSchema = z.object({
  job_title: z.string().trim().min(3, "Job title must be at least 3 characters").max(100, "Job title must be less than 100 characters"),
  job_description: z.string().trim().min(50, "Description must be at least 50 characters").max(5000, "Description must be less than 5000 characters"),
  requirements: z.string().max(3000, "Requirements must be less than 3000 characters").optional(),
  location: z.string().trim().min(2, "Location is required").max(100, "Location must be less than 100 characters"),
  employment_type: z.enum(["internship", "part_time", "full_time", "graduate_program"], {
    errorMap: () => ({ message: "Please select an employment type" })
  }),
  salary_range: z.string().trim().min(3, "Salary range is required (e.g., €500-800/month)").max(50, "Salary must be less than 50 characters"),
  external_url: z.string().url("Please enter a valid URL").optional().or(z.literal(""))
});

type JobFormData = z.infer<typeof jobSchema>;

interface FormErrors {
  [key: string]: string | undefined;
}

const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employer, setEmployer] = useState<any>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [jobData, setJobData] = useState({
    job_title: '',
    job_description: '',
    requirements: '',
    location: '',
    employment_type: '',
    salary_range: '',
    external_url: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('employers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) {
        toast.error("Only employers can post jobs");
        navigate('/student-dashboard');
        return;
      }

      setEmployer(data);
    } catch (error: any) {
      toast.error("Failed to verify employer status");
      navigate('/');
    }
  };

  const validateField = (field: keyof typeof jobData, value: string) => {
    try {
      const partialSchema = z.object({ [field]: jobSchema.shape[field] });
      partialSchema.parse({ [field]: value });
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: err.errors[0]?.message }));
      }
      return false;
    }
  };

  const handleChange = (field: keyof typeof jobData, value: string) => {
    setJobData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof typeof jobData) => {
    validateField(field, jobData[field]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate all fields
      const result = jobSchema.safeParse(jobData);
      
      if (!result.success) {
        const fieldErrors: FormErrors = {};
        result.error.errors.forEach(err => {
          const field = err.path[0] as string;
          if (!fieldErrors[field]) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please fix the errors in the form");
        setLoading(false);
        return;
      }

      const validData = result.data;

      const { error } = await supabase
        .from('job_postings')
        .insert({
          job_title: validData.job_title,
          job_description: validData.job_description,
          requirements: validData.requirements || null,
          location: validData.location,
          employment_type: validData.employment_type as any,
          salary_range: validData.salary_range,
          external_url: validData.external_url || null,
          employer_name: employer.company_name,
          employer_email: employer.company_email,
          employer_id: employer.id,
          is_active: true
        });

      if (error) throw error;

      toast.success("Job posted successfully!");
      navigate('/employer-dashboard');
    } catch (error: any) {
      toast.error(error.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return (
      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3" />
        {errors[field]}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="glass border-b border-glass-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div onClick={() => navigate("/")} className="cursor-pointer">
            <Logo className="text-3xl" />
          </div>
          <Button variant="outline" onClick={() => navigate('/employer-dashboard')}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cta/20 rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-cta" />
              </div>
              <div>
                <CardTitle>Post a New Job</CardTitle>
                <CardDescription>
                  Posting as: {employer?.company_name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Required fields notice */}
              <p className="text-sm text-muted-foreground">
                Fields marked with <span className="text-destructive">*</span> are required
              </p>

              <div className="space-y-2">
                <Label htmlFor="title">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={jobData.job_title}
                  onChange={(e) => handleChange('job_title', e.target.value)}
                  onBlur={() => handleBlur('job_title')}
                  placeholder="e.g., Junior Software Developer"
                  className={errors.job_title ? "border-destructive" : ""}
                />
                <FieldError field="job_title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Employment Type <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={jobData.employment_type} 
                  onValueChange={(value) => handleChange('employment_type', value)}
                >
                  <SelectTrigger className={errors.employment_type ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="graduate_program">Graduate Program</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError field="employment_type" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Job Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={jobData.job_description}
                  onChange={(e) => handleChange('job_description', e.target.value)}
                  onBlur={() => handleBlur('job_description')}
                  placeholder="Describe the role, responsibilities, and what a typical day looks like... (minimum 50 characters)"
                  rows={5}
                  className={errors.job_description ? "border-destructive" : ""}
                />
                <FieldError field="job_description" />
                <p className="text-xs text-muted-foreground">
                  {jobData.job_description.length}/5000 characters (min 50)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={jobData.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  placeholder="List required skills, qualifications, and experience..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={jobData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    onBlur={() => handleBlur('location')}
                    placeholder="e.g., Athens, Thessaloniki, Remote"
                    className={errors.location ? "border-destructive" : ""}
                  />
                  <FieldError field="location" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Salary Range <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="salary"
                    value={jobData.salary_range}
                    onChange={(e) => handleChange('salary_range', e.target.value)}
                    onBlur={() => handleBlur('salary_range')}
                    placeholder="e.g., €500-800/month"
                    className={errors.salary_range ? "border-destructive" : ""}
                  />
                  <FieldError field="salary_range" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">
                  <Link className="w-4 h-4 inline mr-1" />
                  External Application URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={jobData.external_url}
                  onChange={(e) => handleChange('external_url', e.target.value)}
                  onBlur={() => handleBlur('external_url')}
                  placeholder="https://yourcompany.com/careers/apply"
                  className={errors.external_url ? "border-destructive" : ""}
                />
                <FieldError field="external_url" />
                <p className="text-xs text-muted-foreground">
                  If provided, students will be redirected to this URL to apply
                </p>
              </div>

              <Button type="submit" className="w-full bg-cta hover:bg-cta/90" disabled={loading}>
                {loading ? "Posting..." : "Post Job"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PostJob;