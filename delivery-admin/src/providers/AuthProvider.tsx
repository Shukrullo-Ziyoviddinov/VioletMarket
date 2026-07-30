import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getDeliveryProfile,
  updateDeliveryProfile,
  updateDeliveryRegion,
  updateDeliveryTransport,
  uploadDeliveryProfileImage,
  type UpdateDeliveryProfilePayload,
} from '@/services/delivery-auth';
import {
  getStoredToken,
  removeStoredToken,
  storeToken,
} from '@/services/auth-storage';
import type {
  AuthResult,
  DeliveryProfile,
  DeliveryTransport,
} from '@/types/delivery';

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  delivery: DeliveryProfile | null;
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateDeliveryProfilePayload) => Promise<void>;
  updateProfileImage: (imageBase64: string) => Promise<void>;
  updateTransport: (transport: DeliveryTransport) => Promise<void>;
  updateRegion: (region: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryProfile | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const savedToken = await getStoredToken();
        if (!savedToken) return;
        const profile = await getDeliveryProfile(savedToken);
        if (!active) return;
        setToken(savedToken);
        setDelivery(profile);
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
    setToken(result.token);
    setDelivery(result.delivery);
  }, []);

  const signOut = useCallback(async () => {
    await removeStoredToken();
    setToken(null);
    setDelivery(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const profile = await getDeliveryProfile(token);
    setDelivery(profile);
  }, [token]);

  const updateProfile = useCallback(
    async (payload: UpdateDeliveryProfilePayload) => {
      if (!token) throw new Error('Avtorizatsiya talab qilinadi');
      const profile = await updateDeliveryProfile(token, payload);
      setDelivery(profile);
    },
    [token],
  );

  const updateProfileImage = useCallback(
    async (imageBase64: string) => {
      if (!token) throw new Error('Avtorizatsiya talab qilinadi');
      const profile = await uploadDeliveryProfileImage(token, imageBase64);
      setDelivery(profile);
    },
    [token],
  );

  const updateTransport = useCallback(
    async (transport: DeliveryTransport) => {
      if (!token) throw new Error('Avtorizatsiya talab qilinadi');
      const profile = await updateDeliveryTransport(token, transport);
      setDelivery(profile);
    },
    [token],
  );

  const updateRegion = useCallback(
    async (region: string) => {
      if (!token) throw new Error('Avtorizatsiya talab qilinadi');
      const profile = await updateDeliveryRegion(token, region);
      setDelivery(profile);
    },
    [token],
  );

  const value = useMemo(
    () => ({
      isLoading,
      token,
      delivery,
      signIn,
      signOut,
      refreshProfile,
      updateProfile,
      updateProfileImage,
      updateTransport,
      updateRegion,
    }),
    [
      delivery,
      isLoading,
      refreshProfile,
      signIn,
      signOut,
      token,
      updateProfile,
      updateProfileImage,
      updateTransport,
      updateRegion,
    ],
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
