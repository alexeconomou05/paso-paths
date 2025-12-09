import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Target, Users, Briefcase, Heart, Rocket, Shield } from "lucide-react";
import Logo from "@/components/Logo";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold text-xl">GoHire</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About GoHire
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connecting ambitious university students with meaningful career opportunities
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12 glass-card overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Our Mission</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At GoHire, we believe every student deserves access to quality job opportunities that align with their 
              education and career aspirations. Our mission is to bridge the gap between talented university students 
              and forward-thinking employers, creating meaningful connections that launch successful careers.
            </p>
          </CardContent>
        </Card>

        {/* Values Section */}
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Community First</h3>
              </div>
              <p className="text-muted-foreground">
                We foster a supportive community where students can grow, learn, and connect with peers and mentors alike.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Trust & Verification</h3>
              </div>
              <p className="text-muted-foreground">
                Every student is verified through their university credentials, ensuring authentic profiles and trustworthy connections.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Rocket className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Innovation</h3>
              </div>
              <p className="text-muted-foreground">
                We leverage AI-powered matching to connect students with opportunities that truly fit their skills and aspirations.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Authenticity</h3>
              </div>
              <p className="text-muted-foreground">
                We encourage students to be themselves, showcasing their unique talents and personalities to potential employers.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What We Do Section */}
        <Card className="mb-12 glass-card">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-accent/10 rounded-xl">
                <Briefcase className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">What We Do</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                GoHire is a specialized job-matching platform designed exclusively for university students. We understand 
                the unique challenges students face when entering the job market, from balancing studies with work to 
                finding opportunities that provide real learning experiences.
              </p>
              <p>
                Our platform offers:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AI-powered job recommendations based on your field of study and career interests</li>
                <li>Verified student profiles through PASO (student ID) authentication</li>
                <li>Direct connections with employers looking for fresh talent</li>
                <li>Internships, part-time positions, and graduate programs</li>
                <li>A community of like-minded students pursuing their career goals</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of students who have found their dream opportunities through GoHire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth?role=employee">Get Started as Student</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth?role=employer">Register as Employer</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-6 mb-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors">
              About Us
            </Link>
          </div>
          <p>© {new Date().getFullYear()} GoHire. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
