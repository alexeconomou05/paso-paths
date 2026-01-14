import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, DollarSign, Briefcase, GraduationCap, Sparkles, Loader2, Filter, X } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { useTranslation } from "@/hooks/useTranslation";

interface FilterPreferences {
  employmentType?: string;
  location?: string;
  salaryRange?: string;
  [key: string]: string | undefined;
}

const SALARY_RANGES = [
  { value: "all", label: "Any Salary" },
  { value: "0-500", label: "€0 - €500" },
  { value: "500-1000", label: "€500 - €1,000" },
  { value: "1000-2000", label: "€1,000 - €2,000" },
  { value: "2000-3000", label: "€2,000 - €3,000" },
  { value: "3000+", label: "€3,000+" },
];

const Jobs = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeView, setActiveView] = useState<"studies" | "dream">("studies");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>("all");
  const [filtersLoaded, setFiltersLoaded] = useState(false);

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
      // Load saved filter preferences
      const prefs = data?.job_filter_preferences as FilterPreferences | null | undefined;
      if (prefs && typeof prefs === 'object' && !filtersLoaded) {
        setSelectedEmploymentType(prefs.employmentType || "all");
        setSelectedLocation(prefs.location || "all");
        setSelectedSalaryRange(prefs.salaryRange || "all");
        setFiltersLoaded(true);
      }
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
          <h2 className="text-2xl font-bold mb-4">{t('completeProfile')}</h2>
          <p className="text-foreground/70 mb-6">
            {!isVerified && t('verifyStatus') + ' '}
            {!hasCompletedProfile && t('completeProfileDesc') + ' '}
            {t('toAccessRecommendations')}
          </p>
          <Button onClick={() => navigate("/profile")} className="bg-cta hover:bg-cta/90 text-cta-foreground">
            {t('goToProfile')}
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

  // Get unique locations from jobs
  const uniqueLocations = useMemo(() => {
    const locations = jobs
      .map(job => job.location)
      .filter((location): location is string => Boolean(location));
    return [...new Set(locations)].sort();
  }, [jobs]);

  // Parse salary range from string (e.g., "€500 - €1000" or "1000€/month")
  const parseSalaryValue = (salaryStr: string | null): number | null => {
    if (!salaryStr) return null;
    const match = salaryStr.match(/(\d+(?:,\d+)?(?:\.\d+)?)/);
    if (match) {
      return parseFloat(match[1].replace(',', ''));
    }
    return null;
  };

  // Filter jobs based on selected filters
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesType = selectedEmploymentType === "all" || job.employment_type === selectedEmploymentType;
      const matchesLocation = selectedLocation === "all" || job.location === selectedLocation;
      
      // Salary range filter
      let matchesSalary = true;
      if (selectedSalaryRange !== "all") {
        const jobSalary = parseSalaryValue(job.salary_range);
        if (jobSalary !== null) {
          if (selectedSalaryRange === "0-500") {
            matchesSalary = jobSalary >= 0 && jobSalary <= 500;
          } else if (selectedSalaryRange === "500-1000") {
            matchesSalary = jobSalary > 500 && jobSalary <= 1000;
          } else if (selectedSalaryRange === "1000-2000") {
            matchesSalary = jobSalary > 1000 && jobSalary <= 2000;
          } else if (selectedSalaryRange === "2000-3000") {
            matchesSalary = jobSalary > 2000 && jobSalary <= 3000;
          } else if (selectedSalaryRange === "3000+") {
            matchesSalary = jobSalary > 3000;
          }
        } else {
          // If no salary info, exclude from filtered results when salary filter is active
          matchesSalary = false;
        }
      }
      
      return matchesType && matchesLocation && matchesSalary;
    });
  }, [jobs, selectedEmploymentType, selectedLocation, selectedSalaryRange]);

  // Save filter preferences to profile
  const saveFilterPreferences = async () => {
    if (!user?.id) return;
    
    const preferences = {
      employmentType: selectedEmploymentType,
      location: selectedLocation,
      salaryRange: selectedSalaryRange,
    };

    const { error } = await supabase
      .from("profiles")
      .update({ job_filter_preferences: preferences } as any)
      .eq("id", user.id);

    if (error) {
      console.error("Error saving filter preferences:", error);
    } else {
      toast.success("Filter preferences saved!");
    }
  };

  const clearFilters = () => {
    setSelectedEmploymentType("all");
    setSelectedLocation("all");
    setSelectedSalaryRange("all");
  };

  const hasActiveFilters = selectedEmploymentType !== "all" || selectedLocation !== "all" || selectedSalaryRange !== "all";

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
            {t('profile')}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-cta to-accent bg-clip-text text-transparent">
            {t('yourPersonalizedOpportunities')}
          </h1>
          <p className="text-lg text-foreground/70">{t('aiPoweredMatching')}</p>
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
              <span className="font-bold text-lg">{t('basedOnStudiesShort')}</span>
              <span className="text-xs opacity-80">{profile?.field_of_study || t('notSet')}</span>
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
              <span className="font-bold text-lg">{t('dreamRole')}</span>
              <span className="text-xs opacity-80 line-clamp-1">
                {profile?.career_interests ? profile.career_interests.substring(0, 30) + '...' : t('setInProfile')}
              </span>
            </div>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
          </div>
          
          <Select value={selectedEmploymentType} onValueChange={setSelectedEmploymentType}>
            <SelectTrigger className="w-[180px] glass-card">
              <SelectValue placeholder="Employment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="graduate_program">Graduate Program</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px] glass-card">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSalaryRange} onValueChange={setSelectedSalaryRange}>
            <SelectTrigger className="w-[180px] glass-card">
              <SelectValue placeholder="Salary Range" />
            </SelectTrigger>
            <SelectContent>
              {SALARY_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={saveFilterPreferences} className="text-primary">
                Save Filters
              </Button>
            </>
          )}
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <p className="text-center text-sm text-muted-foreground mb-4">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </p>
        )}

        {/* AI Loading indicator */}
        {recommendationLoading && (
          <div className="text-center py-8 mb-8">
            <div className="inline-flex items-center gap-3 glass-card px-6 py-4 rounded-full">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-semibold text-foreground">{t('aiAnalyzing')}</span>
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
            {filteredJobs.map((job, index) => (
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
                  {t('viewOriginal')}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredJobs.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-foreground/70">
              {hasActiveFilters ? "No jobs match your filters" : t('noJobsAvailable')}
            </p>
            <p className="text-sm text-foreground/50 mt-2">
              {hasActiveFilters ? "Try adjusting your filters" : t('checkBackSoon')}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
