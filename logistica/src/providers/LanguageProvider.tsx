import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import i18n, { type AppLanguage } from '@/i18n';
import { getStoredLanguage, storeLanguage } from '@/services/language-storage';

type LanguageContextValue = {
  language: AppLanguage;
  ready: boolean;
  changeLanguage: (language: AppLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<AppLanguage>('uz');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getStoredLanguage()
      .then(async (storedLanguage) => {
        const nextLanguage = storedLanguage || 'uz';
        await i18n.changeLanguage(nextLanguage);
        if (!cancelled) setLanguage(nextLanguage);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const changeLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    await storeLanguage(nextLanguage);
    await i18n.changeLanguage(nextLanguage);
    setLanguage(nextLanguage);
  }, []);

  const value = useMemo(
    () => ({ language, ready, changeLanguage }),
    [changeLanguage, language, ready],
  );

  if (!ready) return null;

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useAppLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useAppLanguage must be used inside LanguageProvider');
  }
  return context;
}
