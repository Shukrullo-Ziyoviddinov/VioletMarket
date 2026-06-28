import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  deleteSellerProduct,
  fetchSellerProducts,
  setSellerProductClientActive,
} from '../api/sellerProductApi';
import { useSellerAuth } from '../context/SellerAuthContext';

export function useSellerProductList({ productFilter = 'all' } = {}) {
  const { token } = useSellerAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuProductId, setOpenMenuProductId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingPauseProductId, setTogglingPauseProductId] = useState(null);

  const loadProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rows = await fetchSellerProducts(token);
      setProducts(rows);
      setOpenMenuProductId(null);
    } catch (err) {
      const errorMessage = err.message || 'Mahsulotlarni yuklab bo\'lmadi';
      setError(errorMessage);
      message.error(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const displayedProducts = useMemo(() => {
    if (productFilter === 'paused') {
      return products.filter((product) => product.clientActive === false);
    }
    return products;
  }, [products, productFilter]);

  const handleDeleteRequest = (productId) => {
    setDeleteTargetId(productId);
  };

  const handleCloseDeleteModal = () => {
    if (deleting) return;
    setDeleteTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (!token || !deleteTargetId || deleting) return;

    setDeleting(true);

    try {
      await deleteSellerProduct(token, deleteTargetId);
      message.success(`Mahsulot #${deleteTargetId} o'chirildi`);
      setProducts((current) => current.filter((product) => product.id !== deleteTargetId));
      setDeleteTargetId(null);
      setOpenMenuProductId(null);
    } catch (err) {
      message.error(err.message || 'Mahsulotni o\'chirib bo\'lmadi');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePause = async (product) => {
    if (!token || !product?.id || togglingPauseProductId != null) return;

    const nextClientActive = product.clientActive === false;
    setTogglingPauseProductId(product.id);

    try {
      await setSellerProductClientActive(token, product.id, nextClientActive);
      setProducts((current) =>
        current.map((row) =>
          row.id === product.id
            ? {
                ...row,
                clientActive: nextClientActive,
                pausedBySeller: !nextClientActive,
              }
            : row,
        ),
      );
      message.success(
        nextClientActive
          ? `Mahsulot #${product.id} faollashtirildi`
          : `Mahsulot #${product.id} vaqtincha to'xtatildi`,
      );
      setOpenMenuProductId(null);
    } catch (err) {
      message.error(err.message || 'Mahsulot holatini o\'zgartirib bo\'lmadi');
    } finally {
      setTogglingPauseProductId(null);
    }
  };

  return {
    token,
    navigate,
    products,
    displayedProducts,
    loading,
    error,
    openMenuProductId,
    setOpenMenuProductId,
    deleteTargetId,
    deleting,
    togglingPauseProductId,
    handleDeleteRequest,
    handleCloseDeleteModal,
    handleConfirmDelete,
    handleTogglePause,
    loadProducts,
  };
}
