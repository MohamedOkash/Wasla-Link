import React, { createContext, useState, useEffect } from 'react';
import arIndexed from '../locales/ar.json';
import enIndexed from '../locales/en.json';
import { translations } from '../data/translations';

const ar = { ...translations.ar, ...arIndexed };
const en = { ...translations.en, ...enIndexed };

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
    const saved = localStorage.getItem('waslalink_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'ar';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('waslalink_lang', language);
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
    localStorage.setItem('waslalink_lang', lang);
  };

  const t = (key: string, variables?: Record<string, any>): string => {
    const dict = language === 'ar' ? ar : en;
    // @ts-ignore
    let translation = dict[key];

    if (!translation) {
      return key; // Fallback to key if missing
    }

    const vars = variables || {};
    translation = translation.replace(/\{\{([^}]+)\}\}|\$\{([^}]+)\}/g, (match: string, p1: string | undefined, p2: string | undefined) => {
      const path = (p1 || p2 || '').trim();
      const parts = path.split('.');
      let current: any = vars;
      for (const part of parts) {
        if (current == null) return '';
        // Remove question marks (optional chaining) and split on fallback
        const cleanPart = part.replace(/\?/g, '').split('||')[0].trim();
        if (!isNaN(Number(cleanPart))) {
          return cleanPart;
        }
        current = current[cleanPart];
      }
      return current !== undefined && current !== null ? String(current) : '';
    });

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
