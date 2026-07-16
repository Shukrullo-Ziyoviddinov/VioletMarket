import React from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerWithdrawalsWorkspace from '../../components/SellerWithdrawals/SellerWithdrawalsWorkspace/SellerWithdrawalsWorkspace';
import './SellerWithdrawalsPage.css';

const { Title } = Typography;

export default function SellerWithdrawalsPage() {
  const { t } = useTranslation();

  return (
    <section className="seller-withdrawals-page">
      <Title level={3} className="seller-withdrawals-page__title">
        {t('sellerWithdrawals.title')}
      </Title>
      <SellerWithdrawalsWorkspace />
    </section>
  );
}
