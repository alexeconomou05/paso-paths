import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Users, Briefcase, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          {!user && (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="font-semibold"
            >
              Sign In
            </Button>
          )}
          {user && (
            <Button 
              onClick={() => navigate('/jobs')}
              className="bg-cta hover:bg-cta/90 text-cta-foreground font-semibold"
            >
              View Jobs
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass-card px-6 py-3 rounded-full mb-8 animate-bounce-in">
            <Sparkles className="w-5 h-5 text-accent animate-wiggle" />
            <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Authentic Community Platform
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-cta to-accent bg-clip-text text-transparent">
              Sign In to Find Jobs
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 text-foreground/80 max-w-2xl mx-auto font-medium">
            Connect with opportunities that match your studies and dream role
          </p>
          
          <p className="text-lg md:text-xl mb-10 text-foreground/60 max-w-2xl mx-auto">
            For verified Greek university students only
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-7 bg-cta hover:bg-cta/90 text-cta-foreground shadow-strong group"
              onClick={() => navigate('/auth?role=employee')}
            >
              <Users className="mr-2 w-6 h-6 group-hover:animate-wiggle" />
              Register as Employee
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              className="text-lg px-8 py-7 bg-primary hover:bg-primary/90 text-primary-foreground shadow-strong group"
              onClick={() => navigate('/auth?role=employer')}
            >
              <Briefcase className="mr-2 w-6 h-6 group-hover:animate-wiggle" />
              Register as Employer
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
            <h3 className="text-2xl font-bold mb-3">Based on Your Studies</h3>
            <p className="text-foreground/70 text-lg">
              Discover opportunities aligned with your field of study and academic background
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl hover:scale-105 transition-all duration-300 border-l-4 border-accent">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-2xl font-bold mb-3">Your Dream Role</h3>
            <p className="text-foreground/70 text-lg">
              Find positions that match your career aspirations and professional goals
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-glass-border py-8 mt-auto">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center gap-6">
            <button 
              onClick={() => navigate('/terms')}
              className="text-foreground/60 hover:text-foreground transition-colors font-medium"
            >
              Terms & Conditions
            </button>
            <button 
              onClick={() => navigate('/privacy')}
              className="text-foreground/60 hover:text-foreground transition-colors font-medium"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => navigate('/about')}
              className="text-foreground/60 hover:text-foreground transition-colors font-medium"
            >
              About Us
            </button>
          </div>
          <p className="text-foreground/60 font-medium">
            © 2025 GoHire - Connecting verified students with authentic opportunities
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
