import { useEffect, useRef } from 'react';
import { useGlobalLoader } from '../context/GlobalLoaderContext';

export function useGlobalLoaderOnInitialLoad(loading, resetKey = 'default') {
  const { setGlobalLoading } = useGlobalLoader();
  const hasFinishedInitialRef = useRef(false);

  useEffect(() => {
    hasFinishedInitialRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (hasFinishedInitialRef.current) return;

    if (loading) {
      setGlobalLoading(true);
      return;
    }

    setGlobalLoading(false);
    hasFinishedInitialRef.current = true;
  }, [loading, setGlobalLoading]);

  useEffect(
    () => () => {
      setGlobalLoading(false);
    },
    [setGlobalLoading],
  );
}
