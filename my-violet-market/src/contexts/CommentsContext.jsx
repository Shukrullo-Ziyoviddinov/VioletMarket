import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useUser } from './UserContext';
import { fetchProductComments, createComment as createCommentApi } from '../api/commentsApi';

const CommentsContext = createContext();

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};

export const CommentsProvider = ({ children }) => {
  const { authToken } = useUser();
  const [comments, setComments] = useState([]);
  const loadingProductsRef = useRef(new Set());
  const loadedProductsRef = useRef(new Set());

  const getCommentsByProductId = useCallback(
    (productId) => {
      const productIdStr = String(productId);
      return comments.filter((c) => String(c.productId) === productIdStr);
    },
    [comments],
  );

  const loadCommentsForProduct = useCallback(async (productId) => {
    const productIdStr = String(productId);
    if (!productIdStr || productIdStr === 'undefined') return;

    if (loadedProductsRef.current.has(productIdStr)) return;
    if (loadingProductsRef.current.has(productIdStr)) return;

    loadingProductsRef.current.add(productIdStr);
    try {
      const data = await fetchProductComments(productIdStr);
      const items = Array.isArray(data.comments) ? data.comments : [];
      setComments((prev) => {
        const rest = prev.filter((c) => String(c.productId) !== productIdStr);
        return [...rest, ...items];
      });
      loadedProductsRef.current.add(productIdStr);
    } catch (err) {
      console.error('Izohlar yuklanmadi:', err);
    } finally {
      loadingProductsRef.current.delete(productIdStr);
    }
  }, []);

  const addComment = useCallback(
    async (comment) => {
      if (!authToken) {
        const err = new Error('UNAUTHORIZED');
        err.code = 'UNAUTHORIZED';
        throw err;
      }

      const rating = Number(comment.rating);
      let validRating = 1;
      if (!Number.isNaN(rating) && rating >= 1 && rating <= 5) {
        validRating = Math.floor(rating);
      }

      const payload = {
        productId: String(comment.productId),
        rating: validRating,
        text: String(comment.text || '').trim(),
        image: comment.image || null,
        isTest: comment.isTest === true,
      };

      const data = await createCommentApi(authToken, payload);
      const saved = data.comment;
      if (!saved) {
        throw new Error('COMMENT_SAVE_FAILED');
      }

      const productIdStr = String(saved.productId);
      setComments((prev) => {
        const rest = prev.filter((c) => c.id !== saved.id);
        return [...rest, saved];
      });
      loadedProductsRef.current.add(productIdStr);
      return saved;
    },
    [authToken],
  );

  const deleteComment = useCallback((commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  const value = {
    comments,
    getCommentsByProductId,
    loadCommentsForProduct,
    addComment,
    deleteComment,
  };

  return (
    <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>
  );
};
