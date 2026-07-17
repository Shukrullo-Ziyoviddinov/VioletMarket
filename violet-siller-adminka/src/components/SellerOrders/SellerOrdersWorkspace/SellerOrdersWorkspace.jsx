import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  collectSellerOrderItem,
  confirmSellerOrderItem,
  fetchSellerOrders,
} from '../../../api/sellerOrdersApi';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import MiniGlobalModal from '../../MiniGlobalModal/MiniGlobalModal';
import SellerOrderCollectionList from '../SellerOrderCollectionList/SellerOrderCollectionList';
import SellerOrderCourierList from '../SellerOrderCourierList/SellerOrderCourierList';
import SellerOrdersList from '../SellerOrdersList/SellerOrdersList';
import SellerOrderDetailModal from '../SellerOrderDetailModal/SellerOrderDetailModal';
import './SellerOrdersWorkspace.css';

export default function SellerOrdersWorkspace({ filter = 'confirmation' }) {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [courierOrder, setCourierOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const trackingStatus = {
        confirmation: 'accepted',
        collection: 'seller_confirmed',
        courier: 'collected',
      }[filter] || 'accepted';
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
    setCourierOrder(null);
  }, [filter]);

  const confirmationOrders = orders.filter(
    (order) => order.trackingStatus === 'accepted',
  );
  const collectionOrders = orders.filter(
    (order) => order.trackingStatus === 'seller_confirmed',
  );
  const courierOrders = orders.filter(
    (order) => order.trackingStatus === 'collected',
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

  const handleCollect = async () => {
    if (!token || !activeOrder || collecting) return;

    setCollecting(true);
    try {
      await collectSellerOrderItem(token, activeOrder.orderId, activeOrder.itemIndex);
      message.success(t('orders.collect.success'));
      setActiveOrder(null);
      await loadOrders();
    } catch (error) {
      message.error(error?.message || t('orders.collect.error'));
    } finally {
      setCollecting(false);
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
      ) : filter === 'collection' ? (
        <SellerOrderCollectionList
          orders={collectionOrders}
          loading={loading}
          onOpenOrder={setActiveOrder}
        />
      ) : (
        <SellerOrderCourierList
          orders={courierOrders}
          loading={loading}
          onOpenOrder={setCourierOrder}
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
        showCollect={
          filter === 'collection' && activeOrder?.trackingStatus === 'seller_confirmed'
        }
        collecting={collecting}
        onCollect={handleCollect}
      />

      <MiniGlobalModal
        open={Boolean(courierOrder)}
        permissionKey="courierHandoff"
        onClose={() => setCourierOrder(null)}
        onConfirm={() => undefined}
      />
    </div>
  );
}
