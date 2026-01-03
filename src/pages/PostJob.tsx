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
import { ArrowLeft, Briefcase, MapPin, DollarSign, Link, FileText } from "lucide-react";
import Logo from "@/components/Logo";

const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employer, setEmployer] = useState<any>(null);
  const [jobData, setJobData] = useState({
    job_title: '',
    job_description: '',
    requirements: '',
    location: '',
    employment_type: 'full_time',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!jobData.job_title || !jobData.job_description || !jobData.employment_type) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('job_postings')
        .insert({
          job_title: jobData.job_title,
          job_description: jobData.job_description,
          requirements: jobData.requirements || null,
          location: jobData.location || null,
          employment_type: jobData.employment_type as any,
          salary_range: jobData.salary_range || null,
          external_url: jobData.external_url || null,
          employer_name: employer.company_name,
          employer_email: employer.company_email,
          employer_id: employer.id, // Link to employer account
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
              <div className="space-y-2">
                <Label htmlFor="title">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Job Title *
                </Label>
                <Input
                  id="title"
                  value={jobData.job_title}
                  onChange={(e) => setJobData({...jobData, job_title: e.target.value})}
                  placeholder="e.g., Junior Software Developer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Employment Type *</Label>
                <Select 
                  value={jobData.employment_type} 
                  onValueChange={(value) => setJobData({...jobData, employment_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="graduate_program">Graduate Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Job Description *
                </Label>
                <Textarea
                  id="description"
                  value={jobData.job_description}
                  onChange={(e) => setJobData({...jobData, job_description: e.target.value})}
                  placeholder="Describe the role, responsibilities, and what a typical day looks like..."
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={jobData.requirements}
                  onChange={(e) => setJobData({...jobData, requirements: e.target.value})}
                  placeholder="List required skills, qualifications, and experience..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={jobData.location}
                    onChange={(e) => setJobData({...jobData, location: e.target.value})}
                    placeholder="e.g., Athens, Remote"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Salary Range
                  </Label>
                  <Input
                    id="salary"
                    value={jobData.salary_range}
                    onChange={(e) => setJobData({...jobData, salary_range: e.target.value})}
                    placeholder="e.g., €800-1200/month"
                  />
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
                  onChange={(e) => setJobData({...jobData, external_url: e.target.value})}
                  placeholder="https://yourcompany.com/careers/apply"
                />
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