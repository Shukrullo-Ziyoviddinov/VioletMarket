import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { groupSellerOrdersByFulfillment } from '../../../utils/sellerOrderGroups';
import SellerOrderHandedCard from '../SellerOrderHandedCard/SellerOrderHandedCard';
import './SellerOrderHandedList.css';

export default function SellerOrderHandedList({
  orders = [],
  loading = false,
  groupByFulfillment = false,
}) {
  const { t } = useTranslation();

  const displayOrders = useMemo(() => {
    if (!groupByFulfillment) return orders;
    return groupSellerOrdersByFulfillment(orders);
  }, [groupByFulfillment, orders]);

  if (loading) {
    return (
      <div className="seller-order-handed-list__state">
        <Spin />
      </div>
    );
  }

  if (!displayOrders.length) {
    return (
      <div className="seller-order-handed-list__state">
        <Empty description={t('orders.handed.empty')} />
      </div>
    );
  }

  return (
    <div className="seller-order-handed-list">
      {displayOrders.map((order) => (
        <SellerOrderHandedCard
          key={order.id || order.groupKey}
          order={order}
        />
      ))}
    </div>
  );
}
