import { useCallback, useEffect, useState } from 'react';
import { fetchCollectionProducts } from '../api/collectionApi';
import { LOAD_MORE_INITIAL } from '../config/sectionLimits';

/**
 * Home bo‘limlari: har "Yana ko‘rsatish" uchun server pagination (DB).
 */
export function usePaginatedCollection(categoryName, { limit = LOAD_MORE_INITIAL } = {}) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPage = useCallback(
    async (pageNum, replace) => {
      if (!categoryName) return;
      setLoading(true);
      try {
        const data = await fetchCollectionProducts(categoryName, { page: pageNum, limit });
        const batch = Array.isArray(data.products) ? data.products : [];
        setProducts((prev) => (replace ? batch : [...prev, ...batch]));
        setPage(pageNum);
        setHasMore(Boolean(data.hasMore));
        setTotal(Number(data.total) || 0);
      } catch (err) {
        console.error(`Bo‘lim yuklanmadi (${categoryName}):`, err);
        if (replace) {
          setProducts([]);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [categoryName, limit],
  );

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(false);
    setTotal(0);
    loadPage(1, true);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadPage(page + 1, false);
  }, [hasMore, loading, loadPage, page]);

  return {
    products,
    total,
    hasMore,
    loading,
    initialLoading: loading && products.length === 0,
    loadMore,
  };
}
