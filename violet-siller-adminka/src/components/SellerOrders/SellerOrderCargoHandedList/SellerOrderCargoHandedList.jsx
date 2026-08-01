import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { groupSellerOrdersByFulfillment } from '../../../utils/sellerOrderGroups';
import SellerOrderCargoHandedCard from '../SellerOrderCargoHandedCard/SellerOrderCargoHandedCard';
import '../SellerOrderHandedList/SellerOrderHandedList.css';

export default function SellerOrderCargoHandedList({
  orders = [],
  loading = false,
}) {
  const { t } = useTranslation();

  const displayOrders = useMemo(
    () => groupSellerOrdersByFulfillment(orders),
    [orders],
  );

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
        <Empty description={t('orders.cargoHanded.empty')} />
      </div>
    );
  }

  return (
    <div className="seller-order-handed-list">
      {displayOrders.map((order) => (
        <SellerOrderCargoHandedCard
          key={order.id || order.groupKey}
          order={order}
        />
      ))}
    </div>
  );
}
