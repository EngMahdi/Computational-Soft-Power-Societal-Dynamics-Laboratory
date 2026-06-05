import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Translations, Locale } from './types';
import { RTL_LOCALES } from './types';
import { en } from './locales/en';
import { ar } from './locales/ar';
import { pt } from './locales/pt';
import { fa } from './locales/fa';
import { tr } from './locales/tr';
import { zh } from './locales/zh';
import { hi } from './locales/hi';
import { ru } from './locales/ru';
import { de } from './locales/de';

const LOCALE_MAP: Record<Locale, Translations> = {
  en,
  ar,
  pt,
  fa,
  tr,
  zh,
  hi,
  ru,
  de,
};

const STORAGE_KEY = 'soft-power-lab-locale';

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in LOCALE_MAP) return stored;
  } catch { /* localStorage unavailable */ }

  // Default to English unconditionally if no user preference is saved
  return 'en';
}

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = RTL_LOCALES.includes(locale as Locale) ? 'rtl' : 'ltr';
  }, [locale]);

  const value: I18nContextValue = {
    locale,
    t: LOCALE_MAP[locale],
    setLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an <I18nProvider>');
  }
  return ctx;
}