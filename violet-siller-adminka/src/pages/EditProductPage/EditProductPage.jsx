import React from 'react';
import { Typography } from 'antd';
import { useParams } from 'react-router-dom';
import AddProductForm from '../../components/AddProductForm/AddProductForm';
import './EditProductPage.css';

const { Title, Text } = Typography;

export default function EditProductPage() {
  const { productId } = useParams();

  return (
    <section className="edit-product-page">
      <div className="edit-product-page__head">
        <Title level={3} className="edit-product-page__title">
          Mahsulotni tahrirlash
        </Title>
        <Text type="secondary" className="edit-product-page__subtitle">
          O&apos;zgarishlarni saqlang — mijozlar saytida yangilanadi.
        </Text>
      </div>

      <AddProductForm editProductId={productId} />
    </section>
  );
}
