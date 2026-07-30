import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { accountTranslations } from './translations/account';
import { authTranslations } from './translations/auth';
import { commonTranslations } from './translations/common';
import { shipmentTranslations } from './translations/shipments';

export type AppLanguage = 'uz' | 'en' | 'zh';

const languages: AppLanguage[] = ['uz', 'en', 'zh'];

function buildTranslation(language: AppLanguage) {
  return {
    ...commonTranslations[language],
    ...authTranslations[language],
    ...shipmentTranslations[language],
    ...accountTranslations[language],
  };
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return languages.includes(value as AppLanguage);
}

export function localeForLanguage(language = i18n.language): string {
  if (language.startsWith('zh')) return 'zh-CN';
  if (language.startsWith('en')) return 'en-US';
  return 'uz-UZ';
}

void i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: buildTranslation('uz') },
    en: { translation: buildTranslation('en') },
    zh: { translation: buildTranslation('zh') },
  },
  lng: 'uz',
  fallbackLng: 'uz',
  supportedLngs: languages,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
