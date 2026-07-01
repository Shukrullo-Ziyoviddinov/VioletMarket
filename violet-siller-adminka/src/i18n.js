import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import uz from './locales/uz.json';
import en from './locales/en.json';
import zh from './locales/zh.json';
import addProductUz from './locales/addProduct.uz.json';
import addProductEn from './locales/addProduct.en.json';
import addProductZh from './locales/addProduct.zh.json';

const resources = {
  uz: { translation: { ...uz, addProduct: addProductUz } },
  en: { translation: { ...en, addProduct: addProductEn } },
  zh: { translation: { ...zh, addProduct: addProductZh } },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'uz',
    supportedLngs: ['uz', 'en', 'zh'],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'violet_seller_adminka_lang',
      checkWhitelist: true,
    },
  });

export default i18n;
