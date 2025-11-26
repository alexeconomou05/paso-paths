import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Briefcase, GraduationCap, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeView, setActiveView] = useState<"studies" | "dream">("studies");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchRecommendations();
    }
  }, [user, profile, activeView]);

  const fetchRecommendations = async () => {
    if (!user?.id) return;
    
    setRecommendationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-jobs', {
        body: { 
          userId: user.id,
          viewType: activeView 
        }
      });

      if (error) {
        console.error("Recommendation error:", error);
        toast.error("Failed to load personalized recommendations");
        // Fallback to regular fetch
        fetchJobs();
      } else if (data?.recommendations) {
        setJobs(data.recommendations);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Failed to load recommendations");
      fetchJobs();
    } finally {
      setRecommendationLoading(false);
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const isVerified = profile?.verification_status === "approved";
  const hasCompletedProfile = profile?.field_of_study && profile?.bio;

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!isVerified || !hasCompletedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="glass-card p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
          <p className="text-foreground/70 mb-6">
            {!isVerified && "Please verify your student status and "}
            {!hasCompletedProfile && "complete your profile with your field of study and skills "}
            to access personalized job recommendations.
          </p>
          <Button onClick={() => navigate("/profile")} className="bg-cta hover:bg-cta/90 text-cta-foreground">
            Go to Profile
          </Button>
        </Card>
      </div>
    );
  }

  const formatEmploymentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleViewChange = (view: "studies" | "dream") => {
    setActiveView(view);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="glass border-b border-glass-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div onClick={() => navigate("/")} className="cursor-pointer">
            <Logo className="text-3xl" />
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/profile")}
            className="font-semibold"
          >
            Profile
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-cta to-accent bg-clip-text text-transparent">
            Your Personalized Opportunities
          </h1>
          <p className="text-lg text-foreground/70">AI-powered job matching based on your profile</p>
        </div>

        {/* Two Pillar Toggle */}
        <div className="flex gap-4 max-w-2xl mx-auto mb-8">
          <Button
            onClick={() => handleViewChange("studies")}
            disabled={recommendationLoading}
            className={`flex-1 h-auto py-6 px-6 rounded-2xl transition-all duration-300 ${
              activeView === "studies"
                ? "bg-gradient-to-br from-primary to-cta text-white shadow-strong scale-105"
                : "glass-card hover:scale-102"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <GraduationCap className="w-8 h-8" />
              <span className="font-bold text-lg">Based on Studies</span>
              <span className="text-xs opacity-80">{profile?.field_of_study || 'Not set'}</span>
            </div>
          </Button>

          <Button
            onClick={() => handleViewChange("dream")}
            disabled={recommendationLoading}
            className={`flex-1 h-auto py-6 px-6 rounded-2xl transition-all duration-300 ${
              activeView === "dream"
                ? "bg-gradient-to-br from-accent to-primary text-white shadow-strong scale-105"
                : "glass-card hover:scale-102"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-8 h-8" />
              <span className="font-bold text-lg">Dream Role</span>
              <span className="text-xs opacity-80 line-clamp-1">
                {profile?.career_interests ? profile.career_interests.substring(0, 30) + '...' : 'Set in profile'}
              </span>
            </div>
          </Button>
        </div>

        {/* AI Loading indicator */}
        {recommendationLoading && (
          <div className="text-center py-8 mb-8">
            <div className="inline-flex items-center gap-3 glass-card px-6 py-4 rounded-full">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-semibold text-foreground">AI is analyzing jobs for you...</span>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {jobs.map((job, index) => (
              <Card
                key={job.id}
                className="glass-card p-6 cursor-pointer group hover:scale-105 hover:-rotate-1 transition-all duration-300 animate-slide-up border-l-4 border-primary relative"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => {
                  if (job.external_url) {
                    window.open(job.external_url, '_blank', 'noopener,noreferrer');
                  } else {
                    navigate(`/jobs/${job.id}`);
                  }
                }}
              >
                {index < 3 && (
                  <div className="absolute -top-3 -right-3 bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-strong">
                    {index + 1}
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {job.job_title}
                  </h3>
                  <Badge className="animate-wiggle bg-accent hover:bg-accent text-accent-foreground rounded-full px-3 py-1">
                    {formatEmploymentType(job.employment_type)}
                  </Badge>
                </div>

                <p className="text-sm font-semibold text-foreground/80 mb-3">{job.employer_name}</p>

                <p className="text-foreground/70 mb-4 line-clamp-3 group-hover:text-foreground transition-colors">
                  {job.job_description}
                </p>

                <div className="space-y-2 mb-4">
                  {job.location && (
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <MapPin className="w-4 h-4 text-primary group-hover:animate-bounce" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.salary_range && (
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <DollarSign className="w-4 h-4 text-accent group-hover:animate-bounce" />
                      <span>{job.salary_range}</span>
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full bg-cta hover:bg-cta/90 text-cta-foreground font-semibold animate-wiggle group-hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (job.external_url) {
                      window.open(job.external_url, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate(`/jobs/${job.id}`);
                    }
                  }}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  View Original
                </Button>
              </Card>
            ))}
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-foreground/70">No jobs available at the moment</p>
            <p className="text-sm text-foreground/50 mt-2">Check back soon for new opportunities!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
