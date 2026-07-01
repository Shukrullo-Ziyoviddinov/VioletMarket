import React from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import AddProductForm from '../../components/AddProductForm/AddProductForm';
import './AddProductsPage.css';

const { Title, Text } = Typography;

export default function AddProductsPage() {
  const { t } = useTranslation();

  return (
    <section className="add-products-page">
      <div className="add-products-page__head">
        <Title level={3} className="add-products-page__title">
          {t('addProduct.page.title')}
        </Title>
        <Text type="secondary" className="add-products-page__subtitle">
          {t('addProduct.page.subtitle')}
        </Text>
      </div>

      <AddProductForm />
    </section>
  );
}
