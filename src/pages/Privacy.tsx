import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

const Privacy = () => {
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

        <h1 className="text-4xl font-bold text-foreground mb-8">{t('privacyTitle')}</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            {t('lastUpdated')}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('introTitle')}</h2>
            <p className="text-muted-foreground">
              {t('introText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('collectTitle')}</h2>
            <p className="text-muted-foreground">{t('collectIntro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>{t('collectList1').split(':')[0]}:</strong>{t('collectList1').split(':')[1]}</li>
              <li><strong>{t('collectList2').split(':')[0]}:</strong>{t('collectList2').split(':')[1]}</li>
              <li><strong>{t('collectList3').split(':')[0]}:</strong>{t('collectList3').split(':')[1]}</li>
              <li><strong>{t('collectList4').split(':')[0]}:</strong>{t('collectList4').split(':')[1]}</li>
              <li><strong>{t('collectList5').split(':')[0]}:</strong>{t('collectList5').split(':')[1]}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('useTitle')}</h2>
            <p className="text-muted-foreground">{t('useIntro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('useList1')}</li>
              <li>{t('useList2')}</li>
              <li>{t('useList3')}</li>
              <li>{t('useList4')}</li>
              <li>{t('useList5')}</li>
              <li>{t('useList6')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('shareTitle')}</h2>
            <p className="text-muted-foreground">{t('shareIntro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>{t('shareList1').split(':')[0]}:</strong>{t('shareList1').split(':')[1]}</li>
              <li><strong>{t('shareList2').split(':')[0]}:</strong>{t('shareList2').split(':')[1]}</li>
              <li><strong>{t('shareList3').split(':')[0]}:</strong>{t('shareList3').split(':')[1]}</li>
            </ul>
            <p className="text-muted-foreground">
              {t('shareNote')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('securityTitle')}</h2>
            <p className="text-muted-foreground">
              {t('securityText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('retentionTitle')}</h2>
            <p className="text-muted-foreground">
              {t('retentionText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('rightsTitle')}</h2>
            <p className="text-muted-foreground">{t('rightsIntro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('rightsList1')}</li>
              <li>{t('rightsList2')}</li>
              <li>{t('rightsList3')}</li>
              <li>{t('rightsList4')}</li>
              <li>{t('rightsList5')}</li>
              <li>{t('rightsList6')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('cookiesTitle')}</h2>
            <p className="text-muted-foreground">
              {t('cookiesText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('childrenTitle')}</h2>
            <p className="text-muted-foreground">
              {t('childrenText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('policyChangesTitle')}</h2>
            <p className="text-muted-foreground">
              {t('policyChangesText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">{t('privacyContactTitle')}</h2>
            <p className="text-muted-foreground">
              {t('privacyContactText')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
