import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Target, Users, Briefcase, Heart, Rocket, Shield } from "lucide-react";
import Logo from "@/components/Logo";
import { useTranslation } from "@/hooks/useTranslation";

const About = () => {
  const { t } = useTranslation();

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
              {t('backToHome')}
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('aboutGoHire')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('aboutSubtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12 glass-card overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{t('ourMission')}</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('missionText')}
            </p>
          </CardContent>
        </Card>

        {/* Values Section */}
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{t('ourValues')}</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">{t('communityFirst')}</h3>
              </div>
              <p className="text-muted-foreground">
                {t('communityFirstDesc')}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t('trustVerification')}</h3>
              </div>
              <p className="text-muted-foreground">
                {t('trustVerificationDesc')}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Rocket className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">{t('innovation')}</h3>
              </div>
              <p className="text-muted-foreground">
                {t('innovationDesc')}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t('authenticity')}</h3>
              </div>
              <p className="text-muted-foreground">
                {t('authenticityDesc')}
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
              <h2 className="text-2xl md:text-3xl font-bold">{t('whatWeDo')}</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                {t('whatWeDoText1')}
              </p>
              <p>
                {t('whatWeDoText2')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('whatWeDoList1')}</li>
                <li>{t('whatWeDoList2')}</li>
                <li>{t('whatWeDoList3')}</li>
                <li>{t('whatWeDoList4')}</li>
                <li>{t('whatWeDoList5')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('readyToStart')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('readyToStartDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth?role=employee">{t('getStartedStudent')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth?role=employer">{t('registerAsEmployer')}</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-6 mb-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              {t('termsOfService')}
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {t('privacyPolicy')}
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors">
              {t('aboutUs')}
            </Link>
          </div>
          <p>© {new Date().getFullYear()} GoHire. {t('allRightsReserved')}</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
