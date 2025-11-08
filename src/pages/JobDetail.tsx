import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Building2, Send } from "lucide-react";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchJobAndProfile();
  }, [id]);

  const fetchJobAndProfile = async () => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Check if user is authenticated and fetch profile
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Check if already applied
        const { data: applicationData } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', id)
          .eq('student_id', user.id)
          .maybeSingle();

        if (applicationData) {
          setHasApplied(true);
        }
      }
    } catch (error: any) {
      toast.error("Failed to load job details");
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!profile) {
      toast.error("Please sign in to apply");
      navigate('/auth');
      return;
    }

    if (profile.verification_status !== 'approved') {
      toast.error("Your account must be verified before applying");
      return;
    }

    if (!profile.cv_url) {
      toast.error("Please upload your CV in your profile before applying");
      navigate('/profile');
      return;
    }

    setApplying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          student_id: user.id,
          cover_letter: coverLetter
        });

      if (error) throw error;

      toast.success("Application submitted successfully!");
      setHasApplied(true);
      setCoverLetter("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  const formatEmploymentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Jobs
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <Badge>{formatEmploymentType(job.employment_type)}</Badge>
                <CardTitle className="text-3xl">{job.job_title}</CardTitle>
                <CardDescription className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {job.employer_name}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {job.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
              )}
              {job.salary_range && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>{job.salary_range}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-3">Job Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {job.job_description}
              </p>
            </div>

            {job.requirements && (
              <div>
                <h3 className="text-xl font-bold mb-3">Requirements</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {job.requirements}
                </p>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-xl font-bold mb-3">Contact</h3>
              <p className="text-muted-foreground">
                Employer Email: <a href={`mailto:${job.employer_email}`} className="text-primary hover:underline">
                  {job.employer_email}
                </a>
              </p>
            </div>

            {!hasApplied ? (
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Apply for This Position</h3>
                {profile ? (
                  profile.verification_status === 'approved' ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                        <Textarea
                          id="cover-letter"
                          placeholder="Tell the employer why you're interested in this position..."
                          rows={6}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <Button 
                        onClick={handleApply} 
                        disabled={applying}
                        size="lg"
                        className="w-full"
                      >
                        <Send className="mr-2 w-4 h-4" />
                        {applying ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  ) : (
                    <Card className="bg-warning/10 border-warning">
                      <CardContent className="pt-6">
                        <p className="text-center">
                          Your account is pending verification. You'll be able to apply once your PASO is verified.
                        </p>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <Card className="bg-muted">
                    <CardContent className="pt-6 text-center">
                      <p className="mb-4">Sign in to apply for this position</p>
                      <Button onClick={() => navigate('/auth')}>
                        Sign In
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-success/10 border-success">
                <CardContent className="pt-6">
                  <p className="text-center font-medium">
                    ✓ You have already applied to this position
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default JobDetail;