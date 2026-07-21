import React from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerOrderNoAnswerCard from '../SellerOrderNoAnswerCard/SellerOrderNoAnswerCard';
import './SellerOrderNoAnswerList.css';

export default function SellerOrderNoAnswerList({
  orders = [],
  loading = false,
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="seller-order-no-answer-list__state">
        <Spin />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-order-no-answer-list__state">
        <Empty description={t('orders.noAnswer.empty')} />
      </div>
    );
  }

  return (
    <div className="seller-order-no-answer-list">
      {orders.map((order) => (
        <SellerOrderNoAnswerCard key={order.id} order={order} />
      ))}
    </div>
  );
}
