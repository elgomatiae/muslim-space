import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { i18n, saveLanguage, loadSavedLanguage } from '@/utils/i18n';

interface I18nContextType {
  t: (key: string, options?: any) => string;
  locale: string;
  changeLanguage: (locale: string) => Promise<void>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    const initLanguage = async () => {
      try {
        const savedLocale = await loadSavedLanguage();
        i18n.setLocale(savedLocale);
        setLocale(savedLocale);
      } catch (error) {
        console.error('Error initializing language:', error);
        i18n.setLocale('en');
        setLocale('en');
      } finally {
        setIsInitialized(true);
      }
    };

    initLanguage();
  }, []);

  const changeLanguage = async (newLocale: string) => {
    try {
      await saveLanguage(newLocale);
      i18n.setLocale(newLocale);
      setLocale(newLocale);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  const t = (key: string, options?: any): string => {
    return i18n.t(key, options);
  };

  // Don't render children until language is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ t, locale, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
