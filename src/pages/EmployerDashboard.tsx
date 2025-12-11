import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Eye, MousePointer, Heart, Building2, Settings, BarChart3, Briefcase, MapPin, Calendar } from "lucide-react";
import Logo from "@/components/Logo";

interface JobPosting {
  id: string;
  job_title: string;
  location: string | null;
  employment_type: string;
  job_description: string;
  salary_range: string | null;
  is_active: boolean;
  created_at: string;
}

interface JobAnalytics {
  views: number;
  clicks: number;
  applications: number;
}

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [employer, setEmployer] = useState<any>(null);
  const [analytics, setAnalytics] = useState<Record<string, JobAnalytics>>({});

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is employer
      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!employerData) {
        navigate('/student-dashboard');
        return;
      }

      setEmployer(employerData);

      // Load employer's job postings
      const { data: jobsData, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('employer_email', employerData.company_email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(jobsData || []);

      // Generate mock analytics for now (in real app, this would come from a database)
      const mockAnalytics: Record<string, JobAnalytics> = {};
      jobsData?.forEach(job => {
        mockAnalytics[job.id] = {
          views: Math.floor(Math.random() * 500) + 50,
          clicks: Math.floor(Math.random() * 100) + 10,
          applications: Math.floor(Math.random() * 30) + 2
        };
      });
      setAnalytics(mockAnalytics);

    } catch (error: any) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'internship': 'Internship',
      'part_time': 'Part Time',
      'full_time': 'Full Time',
      'graduate_program': 'Graduate Program'
    };
    return labels[type] || type;
  };

  const getTotalStats = () => {
    const totals = { views: 0, clicks: 0, applications: 0 };
    Object.values(analytics).forEach(a => {
      totals.views += a.views;
      totals.clicks += a.clicks;
      totals.applications += a.applications;
    });
    return totals;
  };

  const totalStats = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="glass border-b border-glass-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div onClick={() => navigate("/")} className="cursor-pointer">
            <Logo className="text-3xl" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/employer-profile')}>
              <Building2 className="mr-2 w-4 h-4" />
              Company Profile
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="mr-2 w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {employer?.company_name} Dashboard 🏢
            </h1>
            <p className="text-muted-foreground">
              Manage your job postings and track performance
            </p>
          </div>
          <Button 
            onClick={() => navigate('/post-job')}
            className="bg-cta hover:bg-cta/90 text-cta-foreground"
          >
            <Plus className="mr-2 w-4 h-4" />
            Post New Job
          </Button>
        </div>

        {/* Verification Status */}
        {employer?.verification_status !== 'approved' && (
          <Card className="glass-card mb-8 border-l-4 border-yellow-500">
            <CardContent className="p-4">
              <p className="font-semibold">⏳ Account Pending Verification</p>
              <p className="text-sm text-muted-foreground">Your company is being reviewed. You can still post jobs, but they'll be visible after approval.</p>
            </CardContent>
          </Card>
        )}

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-3xl font-bold">{jobs.length}</p>
                </div>
                <Briefcase className="w-10 h-10 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-3xl font-bold">{totalStats.views}</p>
                </div>
                <Eye className="w-10 h-10 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                  <p className="text-3xl font-bold">{totalStats.clicks}</p>
                </div>
                <MousePointer className="w-10 h-10 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-3xl font-bold">{totalStats.applications}</p>
                </div>
                <Heart className="w-10 h-10 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Your Job Postings
        </h2>

        {jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => {
              const jobAnalytics = analytics[job.id] || { views: 0, clicks: 0, applications: 0 };
              return (
                <Card 
                  key={job.id} 
                  className="glass-card hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/job-analytics/${job.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{job.job_title}</h3>
                          <Badge variant={job.is_active ? "default" : "secondary"}>
                            {job.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {getEmploymentTypeLabel(job.employment_type)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Posted {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Mini Analytics */}
                      <div className="flex gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-500">{jobAnalytics.views}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-500">{jobAnalytics.clicks}</p>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">{jobAnalytics.applications}</p>
                          <p className="text-xs text-muted-foreground">Applied</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Jobs Posted Yet</h3>
              <p className="text-muted-foreground mb-4">Start attracting talent by posting your first job</p>
              <Button onClick={() => navigate('/post-job')}>
                <Plus className="mr-2 w-4 h-4" />
                Post Your First Job
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default EmployerDashboard;