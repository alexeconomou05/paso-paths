import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

const Terms = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8">{t('termsTitle')}</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            {t('lastUpdated')}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('acceptanceTitle')}</h2>
            <p className="text-muted-foreground">
              {t('acceptanceText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('eligibilityTitle')}</h2>
            <p className="text-muted-foreground">
              {t('eligibilityText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('accountTitle')}</h2>
            <p className="text-muted-foreground">
              {t('accountText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('conductTitle')}</h2>
            <p className="text-muted-foreground">{t('conductIntro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('conductList1')}</li>
              <li>{t('conductList2')}</li>
              <li>{t('conductList3')}</li>
              <li>{t('conductList4')}</li>
              <li>{t('conductList5')}</li>
              <li>{t('conductList6')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('jobPostingsTitle')}</h2>
            <p className="text-muted-foreground">
              {t('jobPostingsText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('verificationTitle')}</h2>
            <p className="text-muted-foreground">
              {t('verificationText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('ipTitle')}</h2>
            <p className="text-muted-foreground">
              {t('ipText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('liabilityTitle')}</h2>
            <p className="text-muted-foreground">
              {t('liabilityText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('terminationTitle')}</h2>
            <p className="text-muted-foreground">
              {t('terminationText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('changesTitle')}</h2>
            <p className="text-muted-foreground">
              {t('changesText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('contactTitle')}</h2>
            <p className="text-muted-foreground">
              {t('contactText')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
