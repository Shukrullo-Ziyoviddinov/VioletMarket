import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSellerCabinetProfile } from '../api/sellerAuthApi';
import { useSellerAuth } from '../context/SellerAuthContext';
import { isInvalidSellerSessionError } from '../utils/sellerSession';

export function useSellerCabinetSession() {
  const navigate = useNavigate();
  const { token, seller, logout } = useSellerAuth();
  const [isPausedNoticeOpen, setIsPausedNoticeOpen] = useState(false);

  const handleInvalidSession = useCallback(() => {
    navigate('/register', { replace: true });
    logout({ clearRegistration: true });
  }, [logout, navigate]);

  const validateSession = useCallback(async () => {
    if (!token) return;

    try {
      const data = await fetchSellerCabinetProfile(token);
      setIsPausedNoticeOpen(data?.account?.status === 'paused');
    } catch (error) {
      if (isInvalidSellerSessionError(error)) {
        handleInvalidSession();
        return;
      }

      if (seller?.accountStatus === 'paused') {
        setIsPausedNoticeOpen(true);
      }
    }
  }, [token, seller?.accountStatus, handleInvalidSession]);

  useEffect(() => {
    if (!token) {
      setIsPausedNoticeOpen(false);
      return undefined;
    }

    if (seller?.accountStatus === 'paused') {
      setIsPausedNoticeOpen(true);
    }

    validateSession();

    const handleWindowFocus = () => {
      validateSession();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [token, seller?.accountStatus, validateSession]);

  return {
    isPausedNoticeOpen,
    closePausedNotice: () => setIsPausedNoticeOpen(false),
  };
}
