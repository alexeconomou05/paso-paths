import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, MapPin, DollarSign, User, LogOut, X } from "lucide-react";

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>("all");

  useEffect(() => {
    checkAuth();
    fetchJobs();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const getEmploymentBadgeVariant = (type: string) => {
    switch(type) {
      case 'internship': return 'default';
      case 'part_time': return 'secondary';
      case 'full_time': return 'outline';
      case 'graduate_program': return 'outline';
      default: return 'default';
    }
  };

  const formatEmploymentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const uniqueLocations = useMemo(() => {
    const locations = jobs.map(job => job.location).filter(Boolean);
    return Array.from(new Set(locations)).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const locationMatch = selectedLocation === "all" || job.location === selectedLocation;
      const employmentMatch = selectedEmploymentType === "all" || job.employment_type === selectedEmploymentType;
      return locationMatch && employmentMatch;
    });
  }, [jobs, selectedLocation, selectedEmploymentType]);

  const hasActiveFilters = selectedLocation !== "all" || selectedEmploymentType !== "all";

  const resetFilters = () => {
    setSelectedLocation("all");
    setSelectedEmploymentType("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate('/')}>
            Career Platform
          </h1>
          <div className="flex gap-2">
            {user ? (
              <>
                <Button variant="outline" onClick={() => navigate('/profile')}>
                  <User className="mr-2 w-4 h-4" />
                  Profile
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Available Opportunities</h2>
          <p className="text-muted-foreground">
            Browse internships, part-time jobs, and graduate programs for students
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Location</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {uniqueLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Employment Type</label>
            <Select value={selectedEmploymentType} onValueChange={setSelectedEmploymentType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="graduate_program">Graduate Program</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="outline" onClick={resetFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading opportunities...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">
                {jobs.length === 0 ? "No jobs available yet" : "No jobs match your filters"}
              </h3>
              <p className="text-muted-foreground">
                {jobs.length === 0 ? "Check back soon for new opportunities!" : "Try adjusting your filters to see more results"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Card 
                key={job.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={getEmploymentBadgeVariant(job.employment_type)}>
                      {formatEmploymentType(job.employment_type)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{job.job_title}</CardTitle>
                  <CardDescription className="font-medium">
                    {job.employer_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
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
                    <p className="text-muted-foreground line-clamp-3 mt-3">
                      {job.job_description}
                    </p>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Jobs;