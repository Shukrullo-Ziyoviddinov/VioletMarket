import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { isAppLanguage, type AppLanguage } from '@/i18n';

const LANGUAGE_KEY = 'logistica-app-language';

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  const value =
    Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(LANGUAGE_KEY) ?? null
      : await SecureStore.getItemAsync(LANGUAGE_KEY);

  return isAppLanguage(value) ? value : null;
}

export async function storeLanguage(language: AppLanguage) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(LANGUAGE_KEY, language);
    return;
  }

  await SecureStore.setItemAsync(LANGUAGE_KEY, language);
}
