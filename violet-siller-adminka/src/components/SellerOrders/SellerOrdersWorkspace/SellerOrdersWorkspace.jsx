import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  confirmSellerOrderItem,
  fetchSellerOrders,
} from '../../../api/sellerOrdersApi';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import SellerOrderCollectionList from '../SellerOrderCollectionList/SellerOrderCollectionList';
import SellerOrdersList from '../SellerOrdersList/SellerOrdersList';
import SellerOrderDetailModal from '../SellerOrderDetailModal/SellerOrderDetailModal';
import './SellerOrdersWorkspace.css';

export default function SellerOrdersWorkspace({ filter = 'confirmation' }) {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const trackingStatus =
        filter === 'collection' ? 'seller_confirmed' : 'accepted';
      const data = await fetchSellerOrders(token, {
        page: 1,
        limit: 100,
        trackingStatus,
      });
      setOrders(data.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setActiveOrder(null);
  }, [filter]);

  const confirmationOrders = orders.filter(
    (order) => order.trackingStatus === 'accepted',
  );
  const collectionOrders = orders.filter(
    (order) => order.trackingStatus === 'seller_confirmed',
  );

  const handleConfirm = async () => {
    if (!token || !activeOrder || confirming) return;

    setConfirming(true);
    try {
      await confirmSellerOrderItem(token, activeOrder.orderId, activeOrder.itemIndex);
      message.success(t('orders.confirm.success'));
      setActiveOrder(null);
      await loadOrders();
    } catch (error) {
      message.error(error?.message || t('orders.confirm.error'));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="seller-orders-workspace">
      {filter === 'confirmation' ? (
        <SellerOrdersList
          orders={confirmationOrders}
          loading={loading}
          onOpenOrder={setActiveOrder}
        />
      ) : (
        <SellerOrderCollectionList
          orders={collectionOrders}
          loading={loading}
          onOpenOrder={setActiveOrder}
        />
      )}

      <SellerOrderDetailModal
        open={Boolean(activeOrder)}
        order={activeOrder}
        onClose={() => setActiveOrder(null)}
        showConfirm={
          filter === 'confirmation' && activeOrder?.trackingStatus === 'accepted'
        }
        confirming={confirming}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
