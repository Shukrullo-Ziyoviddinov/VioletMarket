import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spin, Typography, message } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { fetchSellerProducts } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import SellerProductCard from '../../components/SellerProductCard/SellerProductCard';
import './MyProductsPage.css';

const { Title, Text } = Typography;

export default function MyProductsPage() {
  const { token } = useSellerAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            />
          ))}
        </div>
      )}
    </section>
  );
}
