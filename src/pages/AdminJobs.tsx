import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { 
  Shield, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Link, 
  FileText,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Download,
  Search,
  Globe
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const COMMON_SEARCH_QUERIES = [
  'σερβιτόρος',
  'πωλητής',
  'marketing',
  'IT support',
  'γραμματέας',
  'λογιστής',
  'διανομέας',
  'barista',
  'receptionist',
  'customer service'
];

const AdminJobs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [jobData, setJobData] = useState({
    job_title: '',
    job_description: '',
    requirements: '',
    location: '',
    employment_type: 'full_time',
    salary_range: '',
    external_url: '',
    employer_name: '',
    employer_email: ''
  });
  const [urlError, setUrlError] = useState('');
  
  // Import settings
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [customQuery, setCustomQuery] = useState('');
  const [sources, setSources] = useState({
    'xe.gr': true,
    'kariera.gr': true
  });
  const [importResult, setImportResult] = useState<{
    scraped: number;
    inserted: number;
    errors: number;
  } | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      const hasAdminRole = roles?.some(r => r.role === 'admin');
      if (!hasAdminRole) {
        toast.error("Access denied. Admin privileges required.");
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error: any) {
      toast.error("Failed to verify admin access");
      navigate('/');
    } finally {
      setCheckingAuth(false);
    }
  };

  const validateUrl = (url: string) => {
    if (!url) {
      setUrlError('External URL is required for external job postings');
      return false;
    }
    try {
      new URL(url);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL (e.g., https://example.com/apply)');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!jobData.job_title || !jobData.job_description || !jobData.employment_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!jobData.employer_name || !jobData.employer_email) {
      toast.error("Please provide employer name and email");
      return;
    }

    // Validate external URL - REQUIRED for external jobs
    if (!validateUrl(jobData.external_url)) {
      toast.error("External URL is required for external job postings");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('job_postings')
        .insert({
          job_title: jobData.job_title,
          job_description: jobData.job_description,
          requirements: jobData.requirements || null,
          location: jobData.location || null,
          employment_type: jobData.employment_type as any,
          salary_range: jobData.salary_range || null,
          external_url: jobData.external_url, // Required!
          employer_name: jobData.employer_name,
          employer_email: jobData.employer_email,
          employer_id: null, // No employer_id = external job
          is_active: true
        });

      if (error) throw error;

      toast.success("External job posted successfully!");
      
      // Reset form
      setJobData({
        job_title: '',
        job_description: '',
        requirements: '',
        location: '',
        employment_type: 'full_time',
        salary_range: '',
        external_url: '',
        employer_name: '',
        employer_email: ''
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const handleImportJobs = async () => {
    if (searchQueries.length === 0) {
      toast.error("Please select at least one search query");
      return;
    }

    const activeSources = Object.entries(sources)
      .filter(([_, enabled]) => enabled)
      .map(([source]) => source);

    if (activeSources.length === 0) {
      toast.error("Please select at least one job source");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('import-jobs', {
        body: { 
          searchQueries,
          sources: activeSources
        }
      });

      if (error) throw error;

      if (data.success) {
        setImportResult({
          scraped: data.scraped,
          inserted: data.inserted,
          errors: data.errors
        });
        toast.success(`Imported ${data.inserted} new jobs from ${activeSources.join(' & ')}`);
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || "Failed to import jobs");
    } finally {
      setImporting(false);
    }
  };

  const toggleQuery = (query: string) => {
    setSearchQueries(prev => 
      prev.includes(query) 
        ? prev.filter(q => q !== query)
        : [...prev, query]
    );
  };

  const addCustomQuery = () => {
    if (customQuery.trim() && !searchQueries.includes(customQuery.trim())) {
      setSearchQueries(prev => [...prev, customQuery.trim()]);
      setCustomQuery('');
    }
  };

  if (checkingAuth || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <Badge variant="outline" className="gap-1">
              <Shield className="w-3 h-3" />
              Admin Panel
            </Badge>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Admin
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="gap-2">
              <Download className="w-4 h-4" />
              Auto Import Jobs
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Add Manually
            </TabsTrigger>
          </TabsList>

          {/* Auto Import Tab */}
          <TabsContent value="import">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Import Jobs from Greek Job Sites</CardTitle>
                    <CardDescription>
                      Automatically scrape and import job listings from xe.gr and kariera.gr
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Source Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Job Sources</Label>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(sources).map(([source, enabled]) => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox
                          id={source}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            setSources(prev => ({ ...prev, [source]: !!checked }))
                          }
                        />
                        <Label htmlFor={source} className="cursor-pointer">{source}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search Queries */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search Queries (select job types to import)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SEARCH_QUERIES.map((query) => (
                      <Badge
                        key={query}
                        variant={searchQueries.includes(query) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleQuery(query)}
                      >
                        {query}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Custom query input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom search term..."
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQuery())}
                    />
                    <Button type="button" variant="outline" onClick={addCustomQuery}>
                      Add
                    </Button>
                  </div>

                  {/* Selected queries */}
                  {searchQueries.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Selected queries:</p>
                      <div className="flex flex-wrap gap-1">
                        {searchQueries.map((q) => (
                          <Badge key={q} variant="secondary" className="gap-1">
                            {q}
                            <button
                              type="button"
                              onClick={() => toggleQuery(q)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Import Result */}
                {importResult && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      <strong>Import Complete:</strong> Scraped {importResult.scraped} jobs, 
                      inserted {importResult.inserted} new jobs
                      {importResult.errors > 0 && `, ${importResult.errors} errors`}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleImportJobs} 
                  disabled={importing || searchQueries.length === 0}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing Jobs...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 w-4 h-4" />
                      Import Jobs from {Object.entries(sources).filter(([_, e]) => e).map(([s]) => s).join(' & ')}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  This will search the selected job sites and import new listings with their actual application URLs.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cta/20 rounded-full flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-cta" />
                  </div>
                  <div>
                    <CardTitle>Add External Job Manually</CardTitle>
                    <CardDescription>
                      Add a job from an external source. External URL is required.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    External jobs require a valid application URL. Students will be redirected to this URL to apply.
                  </AlertDescription>
                </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* External URL - Required and prominent */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-base font-semibold">
                  <Link className="w-4 h-4 inline mr-1" />
                  External Application URL *
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={jobData.external_url}
                  onChange={(e) => {
                    setJobData({...jobData, external_url: e.target.value});
                    if (e.target.value) validateUrl(e.target.value);
                  }}
                  onBlur={() => validateUrl(jobData.external_url)}
                  placeholder="https://company.com/careers/apply"
                  required
                  className={urlError ? "border-destructive" : ""}
                />
                {urlError && (
                  <p className="text-sm text-destructive">{urlError}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employer_name">Employer/Company Name *</Label>
                  <Input
                    id="employer_name"
                    value={jobData.employer_name}
                    onChange={(e) => setJobData({...jobData, employer_name: e.target.value})}
                    placeholder="e.g., Acme Corporation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employer_email">Employer Email *</Label>
                  <Input
                    id="employer_email"
                    type="email"
                    value={jobData.employer_email}
                    onChange={(e) => setJobData({...jobData, employer_email: e.target.value})}
                    placeholder="hr@company.com"
                    required
                  />
                </div>
              </div>

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

              <Button type="submit" className="w-full bg-cta hover:bg-cta/90" disabled={loading}>
                {loading ? "Posting..." : "Post External Job"}
              </Button>
            </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminJobs;