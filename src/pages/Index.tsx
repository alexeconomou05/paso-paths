import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Users, Briefcase, ArrowRight, MessageSquare, Search, Lock, Sun, Flame } from "lucide-react";
import Logo from "@/components/Logo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'home' | 'jobs' | 'streak' | 'profile' | 'about'>('home');
  const [searchQuery, setSearchQuery] = useState("");
  const [streak, setStreak] = useState<{ current_streak_day: number; total_points: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadStreak(session.user.id);
      } else {
        setStreak(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadStreak(session.user.id);
      } else {
        setStreak(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadStreak = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('current_streak_day, total_points')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      setStreak({
        current_streak_day: data.current_streak_day || 0,
        total_points: data.total_points || 0,
      });
    }
  };

  const handleTabClick = (tab: 'home' | 'jobs' | 'streak' | 'profile' | 'about') => {
    if (tab === 'jobs') {
      navigate('/jobs');
    } else if (tab === 'profile') {
      if (!user) {
        toast.error("Please sign in to view your profile");
        navigate('/auth');
      } else {
        navigate('/profile');
      }
    } else if (tab === 'about') {
      navigate('/about');
    } else if (tab === 'streak') {
      if (!user) {
        toast.error("Please sign in to view your streak");
        navigate('/auth');
      } else {
        setActiveTab('streak');
      }
    } else {
      setActiveTab('home');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to search for jobs");
      navigate('/auth');
      return;
    }
    if (searchQuery.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSummerMode = () => {
    if (!user) {
      toast.error("Please sign in to browse summer jobs");
      navigate('/auth');
      return;
    }
    toast.success("☀️ Summer mode activated!");
    const q = searchQuery.trim();
    navigate(`/jobs?summer=1${q ? `&search=${encodeURIComponent(q)}` : ''}`);
  };

  const tabs = [
    { id: 'home' as const, label: 'Home' },
    { id: 'jobs' as const, label: 'Jobs' },
    { id: 'streak' as const, label: '🔥 Streak' },
    { id: 'profile' as const, label: 'Profile' },
    { id: 'about' as const, label: 'About Us' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_hsla(195,95%,50%,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-glass-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo className="text-3xl md:text-4xl" />
          <div className="flex items-center gap-3">
            {!user && (
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="font-semibold"
              >
                {t('signIn')}
              </Button>
            )}
            {user && (
              <Button 
                onClick={() => navigate('/jobs')}
                className="bg-cta hover:bg-cta/90 text-cta-foreground font-semibold"
              >
                {t('viewJobs')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="relative z-10 glass border-b border-glass-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="relative z-10 container mx-auto px-4 pt-6">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={user ? "Search for jobs..." : "Sign in to search for jobs"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-24 h-12 rounded-full glass border-glass-border text-base"
              disabled={!user}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!user}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-cta hover:bg-cta/90 text-cta-foreground"
            >
              {user ? 'Search' : <Lock className="w-4 h-4" />}
            </Button>
          </div>
          {!user && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              <button type="button" onClick={() => navigate('/auth')} className="underline hover:text-foreground">
                Sign in
              </button>{" "}to search and browse jobs
            </p>
          )}
          {/* Summer mode toggle - bottom center */}
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={handleSummerMode}
              title="Switch to Summer Mode — student summer jobs only"
              aria-label="Activate summer mode"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold shadow-strong hover:scale-110 transition-all duration-300"
              style={{
                background:
                  'linear-gradient(135deg, #fde047 0%, #fb923c 50%, #f43f5e 100%)',
              }}
            >
              <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-sm">Summer Jobs</span>
            </button>
          </div>
        </form>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass-card px-6 py-3 rounded-full mb-8 animate-bounce-in">
            <Sparkles className="w-5 h-5 text-accent animate-wiggle" />
            <span className="font-semibold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-text)' }}>
              {t('authenticCommunityPlatform')}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-text)' }}>
              {t('signInToFindJobs')}
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 text-foreground/80 max-w-2xl mx-auto font-medium">
            {t('connectWithOpportunities')}
          </p>
          
          <p className="text-lg md:text-xl mb-10 text-foreground/60 max-w-2xl mx-auto">
            {t('forVerifiedStudents')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-7 bg-cta hover:bg-cta/90 text-cta-foreground shadow-strong group"
              onClick={() => navigate('/auth?role=employee')}
            >
              <Users className="mr-2 w-6 h-6 group-hover:animate-wiggle" />
              {t('registerAsEmployee')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              className="text-lg px-8 py-7 bg-primary hover:bg-primary/90 text-primary-foreground shadow-strong group"
              onClick={() => navigate('/auth?role=employer')}
            >
              <Briefcase className="mr-2 w-6 h-6 group-hover:animate-wiggle" />
              {t('registerAsEmployer')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 container mx-auto px-4 py-16 pb-24">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="glass-card p-8 rounded-3xl hover:scale-105 transition-all duration-300 border-l-4 border-primary">
            <div className="text-5xl mb-4">🎓</div>
            <h3 className="text-2xl font-bold mb-3">{t('basedOnStudies')}</h3>
            <p className="text-foreground/70 text-lg">
              {t('basedOnStudiesDesc')}
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl hover:scale-105 transition-all duration-300 border-l-4 border-accent">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-2xl font-bold mb-3">{t('yourDreamRole')}</h3>
            <p className="text-foreground/70 text-lg">
              {t('yourDreamRoleDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-glass-border py-8 mt-auto">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-6">
            <button 
              onClick={() => navigate('/company-reviews')}
              className="text-foreground/60 hover:text-foreground transition-colors font-medium"
            >
              Company Reviews
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="text-foreground/60 hover:text-foreground transition-colors font-medium"
            >
              {t('termsConditions')}
            </button>
            <button 
              onClick={() => navigate('/privacy')}
              className="text-foreground/60 hover:text-foreground transition-colors font-medium"
            >
              {t('privacyPolicy')}
            </button>
            <button 
              onClick={() => navigate('/about')}
              className="text-foreground/60 hover:text-foreground transition-colors font-medium"
            >
              {t('aboutUs')}
            </button>
          </div>
          <p className="text-foreground/60 font-medium">
            {t('copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
