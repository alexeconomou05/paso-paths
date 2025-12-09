import { useLanguage, Language } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

export function useTranslation() {
  const { language } = useLanguage();
  
  const t = (key: string): string => {
    return translations[language as Language]?.[key] || translations.en[key] || key;
  };
  
  return { t, language };
}
