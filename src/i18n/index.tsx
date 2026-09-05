import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { en, type TranslationKey } from './translations/en';
import { hi } from './translations/hi';
import { ml } from './translations/ml';

export type { TranslationKey };

export type LanguageCode = 'en' | 'hi' | 'ml';

export const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
];

const DICTS: Record<LanguageCode, Record<TranslationKey, string>> = {
  en,
  hi,
  ml,
};

/** Accessibility text-size levels applied across shared components. */
export type TextSizeLevel = 'small' | 'normal' | 'large';

const SCALE: Record<TextSizeLevel, number> = {
  small: 0.9,
  normal: 1,
  large: 1.18,
};

type I18nValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  textSize: TextSizeLevel;
  setTextSize: (level: TextSizeLevel) => void;
  /** Scale a base font size by the accessibility setting. */
  fs: (base: number) => number;
};

const I18nContext = createContext<I18nValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

/** Read the persisted language once at mount (lazy, side-effect-free). */
function getInitialLanguage(): LanguageCode {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('kks.lang');
      if (saved === 'en' || saved === 'hi' || saved === 'ml') {
        return saved;
      }
    }
  } catch {
    // localStorage unavailable — keep defaults.
  }
  return 'en';
}

/** Read the persisted text-size level once at mount (lazy, side-effect-free). */
function getInitialTextSize(): TextSizeLevel {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('kks.textSize');
      if (saved === 'small' || saved === 'normal' || saved === 'large') {
        return saved;
      }
    }
  } catch {
    // ignore
  }
  return 'normal';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(getInitialLanguage);
  const [textSize, setTextSize] = useState<TextSizeLevel>(getInitialTextSize);

  const changeLanguage = useCallback((code: LanguageCode) => {
    setLanguage(code);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('kks.lang', code);
      }
    } catch {
      // ignore
    }
  }, []);

  const changeTextSize = useCallback((level: TextSizeLevel) => {
    setTextSize(level);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('kks.textSize', level);
      }
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = DICTS[language];
    return {
      language,
      setLanguage: changeLanguage,
      t: (key, vars) => interpolate(dict[key] ?? en[key] ?? key, vars),
      textSize,
      setTextSize: changeTextSize,
      fs: (base: number) => Math.round(base * SCALE[textSize] * 2) / 2,
    };
  }, [language, textSize, changeLanguage, changeTextSize]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

/** Convenience hook for translated strings only. */
export function useTranslation() {
  return useI18n().t;
}
