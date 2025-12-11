import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, MapPin, Clock, ExternalLink, User, Settings, GraduationCap, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import { useTranslation } from "@/hooks/useTranslation";

interface JobPosting {
  id: string;
  job_title: string;
  employer_name: string;
  location: string | null;
  employment_type: string;
  job_description: string;
  salary_range: string | null;
  external_url: string | null;
  created_at: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'field' | 'interests'>('field');

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
      const { data: employer } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (employer) {
        navigate('/employer-dashboard');
        return;
      }

      // Load student profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Load jobs
      const { data: jobsData, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(jobsData || []);
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

  const getEmploymentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'internship': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'part_time': 'bg-green-500/20 text-green-400 border-green-500/30',
      'full_time': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'graduate_program': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  // Group jobs by employment type
  const groupedJobs = jobs.reduce((acc, job) => {
    const type = job.employment_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(job);
    return acc;
  }, {} as Record<string, JobPosting[]>);

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
            <Button variant="outline" onClick={() => navigate('/profile')}>
              <User className="mr-2 w-4 h-4" />
              Profile
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {profile?.verification_status === 'approved' 
              ? "Here are job opportunities matched for you"
              : "Complete your profile verification to unlock personalized recommendations"}
          </p>
        </div>

        {/* Profile Status Card */}
        {profile?.verification_status !== 'approved' && (
          <Card className="glass-card mb-8 border-l-4 border-yellow-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">⏳ Verification Pending</p>
                <p className="text-sm text-muted-foreground">Complete your profile to get personalized job recommendations</p>
              </div>
              <Button onClick={() => navigate('/profile')}>
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recommendation Tabs */}
        <div className="flex gap-4 mb-6">
          <Button 
            variant={activeTab === 'field' ? 'default' : 'outline'}
            onClick={() => setActiveTab('field')}
            className="flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            Based on Studies
          </Button>
          <Button 
            variant={activeTab === 'interests' ? 'default' : 'outline'}
            onClick={() => setActiveTab('interests')}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Dream Role
          </Button>
        </div>

        {activeTab === 'field' && profile?.field_of_study && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing jobs relevant to: <span className="font-semibold text-foreground">{profile.field_of_study}</span>
          </p>
        )}

        {activeTab === 'interests' && profile?.career_interests && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing jobs matching: <span className="font-semibold text-foreground">{profile.career_interests}</span>
          </p>
        )}

        {/* Jobs by Category */}
        {Object.entries(groupedJobs).length > 0 ? (
          Object.entries(groupedJobs).map(([type, typeJobs]) => (
            <div key={type} className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Badge className={getEmploymentTypeColor(type)}>
                  {getEmploymentTypeLabel(type)}
                </Badge>
                <span className="text-muted-foreground text-sm font-normal">({typeJobs.length} jobs)</span>
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeJobs.map((job) => (
                  <Card 
                    key={job.id} 
                    className="glass-card hover:scale-[1.02] transition-all cursor-pointer"
                    onClick={() => job.external_url ? window.open(job.external_url, '_blank') : navigate(`/jobs/${job.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-1">{job.job_title}</CardTitle>
                        {job.external_url && <ExternalLink className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <p className="text-sm text-primary font-medium">{job.employer_name}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {job.job_description}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {job.location && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="text-green-500 font-medium">
                            {job.salary_range}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Jobs Available</h3>
              <p className="text-muted-foreground">Check back soon for new opportunities!</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;