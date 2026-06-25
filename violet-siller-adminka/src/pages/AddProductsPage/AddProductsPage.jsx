import React from 'react';
import { Typography } from 'antd';
import AddProductForm from '../../components/AddProductForm/AddProductForm';
import './AddProductsPage.css';

const { Title, Text } = Typography;

export default function AddProductsPage() {
  return (
    <section className="add-products-page">
      <div className="add-products-page__head">
        <Title level={3} className="add-products-page__title">
          Mahsulot qo&apos;shish
        </Title>
        <Text type="secondary" className="add-products-page__subtitle">
          Yangi mahsulot ma&apos;lumotlarini kiriting. Har bir maydon ostida nima yozish kerakligi
          tushuntirilgan.
        </Text>
      </div>

      <AddProductForm />
    </section>
  );
}
