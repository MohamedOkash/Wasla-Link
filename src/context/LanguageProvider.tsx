import React, { createContext, useState, useEffect } from 'react';
import ar from '../locales/ar.json';
import en from '../locales/en.json';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  isRTL: false,
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('wasla_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('wasla_lang', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const dict = language === 'ar' ? ar : en;
    // @ts-ignore
    let translation = dict[key];

    if (!translation) {
      return key; // Fallback to key if missing
    }

    if (variables) {
      Object.keys(variables).forEach((varKey) => {
        translation = translation.replace(new RegExp(`{{${varKey}}}`, 'g'), String(variables[varKey]));
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
