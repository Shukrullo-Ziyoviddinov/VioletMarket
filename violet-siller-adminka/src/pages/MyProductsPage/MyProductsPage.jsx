import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spin, Typography, message } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { deleteSellerProduct, fetchSellerProducts } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import MiniGlobalModal from '../../components/MiniGlobalModal/MiniGlobalModal';
import SellerProductCard from '../../components/SellerProductCard/SellerProductCard';
import './MyProductsPage.css';

const { Title, Text } = Typography;

export default function MyProductsPage() {
  const { token } = useSellerAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuProductId, setOpenMenuProductId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <section className="my-products-page">
      <div className="my-products-page__head">
        <div>
          <Title level={3} className="my-products-page__title">
            Mening mahsulotlarim
          </Title>
          <Text type="secondary" className="my-products-page__subtitle">
            Do&apos;koningizga tegishli barcha mahsulotlar ro&apos;yxati.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          onClick={() => navigate('/products/add')}
        >
          Mahsulot qo&apos;shish
        </Button>
      </div>

      {error ? <Alert type="error" message={error} showIcon className="my-products-page__alert" /> : null}

      {loading ? (
        <div className="my-products-page__loading">
          <Spin size="large" />
        </div>
      ) : products.length === 0 ? (
        <div className="my-products-page__empty">
          <Text type="secondary">Hozircha mahsulot yo&apos;q.</Text>
          <Button type="link" onClick={() => navigate('/products/add')}>
            Birinchi mahsulotni qo&apos;shing
          </Button>
        </div>
      ) : (
        <div className="my-products-page__list">
          {products.map((product) => (
            <SellerProductCard
              key={product.id}
              product={product}
              onEdit={(productId) => navigate(`/products/${productId}/edit`)}
              onDelete={handleDeleteRequest}
              isMenuOpen={openMenuProductId === product.id}
              onMenuToggle={() => {
                setOpenMenuProductId((current) => (current === product.id ? null : product.id));
              }}
              onMenuClose={() => setOpenMenuProductId(null)}
            />
          ))}
        </div>
      )}

      <MiniGlobalModal
        open={deleteTargetId != null}
        permissionKey="deleteProduct"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
      />
    </section>
  );
}
