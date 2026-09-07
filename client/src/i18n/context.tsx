import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { hu } from './hu';
import { de } from './de';

export type Lang = 'en' | 'hu' | 'de';
export type TranslationKey = keyof typeof en;

const DICTS: Record<Lang, Record<TranslationKey, string>> = { en, hu, de };

const STORAGE_KEY = 'pvstoragesizer-lang';

if (import.meta.env.DEV) {
  for (const [name, dict] of [
    ['hu', hu],
    ['de', de],
  ] as const) {
    const missing = Object.keys(en).filter((k) => !(k in dict));
    if (missing.length > 0) console.error(`[i18n] "${name}" translation is missing keys:`, missing);
  }
}

function isLang(v: string | null): v is Lang {
  return v === 'en' || v === 'hu' || v === 'de';
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLang(stored) ? stored : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => interpolate(DICTS[lang][key], params),
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider');
  return ctx;
}
