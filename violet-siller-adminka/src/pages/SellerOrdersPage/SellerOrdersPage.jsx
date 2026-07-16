import React from 'react';
import { useTranslation } from 'react-i18next';
import SellerOrdersWorkspace from '../../components/SellerOrders/SellerOrdersWorkspace/SellerOrdersWorkspace';
import './SellerOrdersPage.css';

export default function SellerOrdersPage() {
  const { t } = useTranslation();

  return (
    <section className="seller-orders-page">
      <h1 className="seller-orders-page__title">{t('orders.title')}</h1>
      <SellerOrdersWorkspace />
    </section>
  );
}
