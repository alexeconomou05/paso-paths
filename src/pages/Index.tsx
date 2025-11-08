import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Briefcase, GraduationCap, Shield, CheckCircle2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Verified Students Only</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Connect Greek Students with Their Dream Careers
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              The secure job platform exclusively for verified university students. 
              Your PASO is your gateway to opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8 py-6"
                onClick={() => navigate('/auth')}
              >
                <GraduationCap className="mr-2 w-5 h-5" />
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-primary-foreground"
                onClick={() => navigate('/jobs')}
              >
                <Briefcase className="mr-2 w-5 h-5" />
                Browse Jobs
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A trusted space for students to launch their careers with verified opportunities
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Students Only</h3>
              <p className="text-muted-foreground">
                Every account is verified through your university PASO, ensuring a trusted community
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Quality Opportunities</h3>
              <p className="text-muted-foreground">
                Internships, part-time jobs, and graduate programs tailored for students
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Career Growth</h3>
              <p className="text-muted-foreground">
                Build your profile, upload your CV, and connect with employers looking for talent
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Simple steps to launch your career</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                step: "1",
                title: "Create Your Account",
                description: "Sign up with your university email and upload your PASO for verification"
              },
              {
                step: "2",
                title: "Build Your Profile",
                description: "Add your education, skills, and upload your CV to showcase your potential"
              },
              {
                step: "3",
                title: "Apply for Jobs",
                description: "Browse opportunities and apply to positions that match your goals"
              },
              {
                step: "4",
                title: "Connect with Employers",
                description: "Get noticed by companies looking for talented students like you"
              }
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Career Journey?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Join thousands of verified students finding their perfect opportunity
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={() => navigate('/auth')}
          >
            <CheckCircle2 className="mr-2 w-5 h-5" />
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Student Career Platform. Connecting verified students with opportunities.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;