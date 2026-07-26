import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'logistica-auth-token';
const REGISTERED_FLAG_KEY = 'logistica-has-registered';

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getStoredToken() {
  return getItem(TOKEN_KEY);
}

export async function storeToken(token: string) {
  await setItem(TOKEN_KEY, token);
}

export async function removeStoredToken() {
  await removeItem(TOKEN_KEY);
}

export async function getHasRegistered() {
  const value = await getItem(REGISTERED_FLAG_KEY);
  return value === '1';
}

export async function setHasRegistered() {
  await setItem(REGISTERED_FLAG_KEY, '1');
}
