import { useEffect, useState } from 'react';
import { fetchSellerCabinetProfile } from '../api/sellerAuthApi';
import { useSellerAuth } from '../context/SellerAuthContext';

export function useSellerPausedNotice() {
  const { token, seller } = useSellerAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsOpen(false);
      return undefined;
    }

    if (seller?.accountStatus === 'paused') {
      setIsOpen(true);
      return undefined;
    }

    let cancelled = false;

    fetchSellerCabinetProfile(token)
      .then((data) => {
        if (cancelled) return;
        setIsOpen(data?.account?.status === 'paused');
      })
      .catch(() => {
        if (!cancelled) {
          setIsOpen(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, seller?.accountStatus]);

  return {
    isOpen,
    close: () => setIsOpen(false),
  };
}
