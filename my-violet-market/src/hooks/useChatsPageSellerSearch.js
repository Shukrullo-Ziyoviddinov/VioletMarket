import { useEffect, useState } from 'react';
import { fetchChatsPageSellerSearch } from '../api/chatsPageSearchApi';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function useChatsPageSellerSearch(query, enabled = true) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const trimmed = String(query || '').trim();

    if (!enabled || trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchChatsPageSellerSearch(trimmed);
        if (!cancelled) {
          setResults(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(err?.message || 'Search failed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, enabled]);

  return { results, loading, error };
}
