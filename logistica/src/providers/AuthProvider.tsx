import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getLogisticaProfile } from '@/services/logistica-auth';
import {
  getHasRegistered,
  getStoredToken,
  removeStoredToken,
  setHasRegistered,
  storeToken,
} from '@/services/auth-storage';
import type { AuthResult, LogisticaProfile } from '@/types/logistica';

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  profile: LogisticaProfile | null;
  hasRegistered: boolean;
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  markRegistered: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<LogisticaProfile | null>(null);
  const [hasRegistered, setHasRegisteredState] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const [savedToken, registered] = await Promise.all([
          getStoredToken(),
          getHasRegistered(),
        ]);
        if (!active) return;
        setHasRegisteredState(registered);

        if (!savedToken) return;
        const nextProfile = await getLogisticaProfile(savedToken);
        if (!active) return;
        setToken(savedToken);
        setProfile(nextProfile);
      } catch {
        await removeStoredToken();
      } finally {
        if (active) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (result: AuthResult) => {
    await storeToken(result.token);
    await setHasRegistered();
    setToken(result.token);
    setProfile(result.profile);
    setHasRegisteredState(true);
  }, []);

  const signOut = useCallback(async () => {
    await removeStoredToken();
    setToken(null);
    setProfile(null);
  }, []);

  const markRegistered = useCallback(async () => {
    await setHasRegistered();
    setHasRegisteredState(true);
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      token,
      profile,
      hasRegistered,
      signIn,
      signOut,
      markRegistered,
    }),
    [hasRegistered, isLoading, markRegistered, profile, signIn, signOut, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  }
  return value;
}
