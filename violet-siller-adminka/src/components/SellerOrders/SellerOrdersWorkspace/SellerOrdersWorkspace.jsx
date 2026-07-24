import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  cancelSellerOrderItem,
  collectSellerOrderItem,
  confirmSellerOrderItem,
  deliverSellerNoAnswerOrder,
  fetchSellerOrders,
  handoffSellerOrderItem,
  reactivateSellerNoAnswerOrder,
  reHandoffSellerNoAnswerOrder,
} from '../../../api/sellerOrdersApi';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import MiniGlobalModal from '../../MiniGlobalModal/MiniGlobalModal';
import SellerOrderCollectionList from '../SellerOrderCollectionList/SellerOrderCollectionList';
import SellerOrderCourierList from '../SellerOrderCourierList/SellerOrderCourierList';
import SellerOrderHandedList from '../SellerOrderHandedList/SellerOrderHandedList';
import SellerOrderNoAnswerList from '../SellerOrderNoAnswerList/SellerOrderNoAnswerList';
import SellerOrdersList from '../SellerOrdersList/SellerOrdersList';
import SellerOrderDetailModal from '../SellerOrderDetailModal/SellerOrderDetailModal';
import './SellerOrdersWorkspace.css';

const FILTER_STATUS = {
  confirmation: 'accepted',
  collection: 'seller_confirmed',
  courier: 'collected',
  handed: 'handed_to_courier',
  noAnswer: 'no_answer',
};

export default function SellerOrdersWorkspace({ filter = 'confirmation' }) {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [courierOrder, setCourierOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [handingOff, setHandingOff] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const trackingStatus = FILTER_STATUS[filter] || 'accepted';
      const data = await fetchSellerOrders(token, {
        page: 1,
        limit: 100,
        trackingStatus,
      });
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
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
    setOrders([]);
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
  const handedOrders = orders.filter(
    (order) => order.trackingStatus === 'handed_to_courier',
  );
  const noAnswerOrders =
    filter === 'noAnswer'
      ? orders
      : orders.filter((order) => order.trackingStatus === 'no_answer');

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

  const handleCourierHandoff = async () => {
    if (!token || !courierOrder || handingOff) return;

    setHandingOff(true);
    try {
      await handoffSellerOrderItem(token, courierOrder.orderId, courierOrder.itemIndex);
      message.success(t('orders.courier.success', { defaultValue: 'Mahsulot kuryerga topshirildi' }));
      setCourierOrder(null);
      await loadOrders();
    } catch (error) {
      message.error(
        error?.message ||
          t('orders.courier.error', { defaultValue: 'Kuryerga topshirib bo‘lmadi' }),
      );
      throw error;
    } finally {
      setHandingOff(false);
    }
  };

  const handleCancelOrder = async (targetOrder) => {
    const order = targetOrder || activeOrder || courierOrder;
    if (!token || !order || cancelling) return;

    setCancelling(true);
    try {
      await cancelSellerOrderItem(token, order.orderId, order.itemIndex);
      message.success(t('orders.cancel.success'));
      setActiveOrder(null);
      setCourierOrder(null);
      await loadOrders();
    } catch (error) {
      message.error(error?.message || t('orders.cancel.error'));
    } finally {
      setCancelling(false);
    }
  };

  const handleNoAnswerReHandoff = async (order) => {
    if (!token || !order?.id) return;
    try {
      await reHandoffSellerNoAnswerOrder(token, order.id);
      message.success(
        t('orders.noAnswer.reHandoffSuccess', {
          defaultValue: 'Buyurtma qayta kuryerga topshirildi',
        }),
      );
      await loadOrders();
    } catch (error) {
      message.error(
        error?.message ||
          t('orders.noAnswer.actionError', { defaultValue: 'Amal bajarilmadi' }),
      );
    }
  };

  const handleNoAnswerReactivate = async (order) => {
    if (!token || !order?.id) return;
    try {
      await reactivateSellerNoAnswerOrder(token, order.id);
      message.success(
        t('orders.noAnswer.reactivateSuccess', {
          defaultValue: 'Mahsulot qayta sotuvga qo‘yildi',
        }),
      );
      await loadOrders();
    } catch (error) {
      message.error(
        error?.message ||
          t('orders.noAnswer.actionError', { defaultValue: 'Amal bajarilmadi' }),
      );
    }
  };

  const handleNoAnswerDeliver = async (order) => {
    if (!token || !order?.id) return;
    try {
      await deliverSellerNoAnswerOrder(token, order.id);
      message.success(
        t('orders.noAnswer.deliverSuccess', {
          defaultValue: 'Buyurtma mijozga topshirildi deb belgilandi',
        }),
      );
      await loadOrders();
    } catch (error) {
      message.error(
        error?.message ||
          t('orders.noAnswer.actionError', { defaultValue: 'Amal bajarilmadi' }),
      );
    }
  };

  let listNode = null;
  if (filter === 'confirmation') {
    listNode = (
      <SellerOrdersList
        orders={confirmationOrders}
        loading={loading}
        onOpenOrder={setActiveOrder}
      />
    );
  } else if (filter === 'collection') {
    listNode = (
      <SellerOrderCollectionList
        orders={collectionOrders}
        loading={loading}
        onOpenOrder={setActiveOrder}
      />
    );
  } else if (filter === 'courier') {
    listNode = (
      <SellerOrderCourierList
        orders={courierOrders}
        loading={loading}
        onOpenOrder={setCourierOrder}
      />
    );
  } else if (filter === 'handed') {
    listNode = (
      <SellerOrderHandedList orders={handedOrders} loading={loading} />
    );
  } else if (filter === 'noAnswer') {
    listNode = (
      <SellerOrderNoAnswerList
        orders={noAnswerOrders}
        loading={loading}
        onReHandoff={handleNoAnswerReHandoff}
        onReactivate={handleNoAnswerReactivate}
        onDeliver={handleNoAnswerDeliver}
      />
    );
  }

  return (
    <div className="seller-orders-workspace">
      {listNode}

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
        showCancelOrder={
          (filter === 'confirmation' && activeOrder?.trackingStatus === 'accepted') ||
          (filter === 'collection' &&
            activeOrder?.trackingStatus === 'seller_confirmed')
        }
        cancelling={cancelling}
        onCancelOrder={() => handleCancelOrder(activeOrder)}
      />

      <MiniGlobalModal
        open={Boolean(courierOrder)}
        permissionKey="courierHandoff"
        loading={handingOff || cancelling}
        onClose={() => {
          if (!handingOff && !cancelling) setCourierOrder(null);
        }}
        onConfirm={handleCourierHandoff}
        onCancelOrder={() => handleCancelOrder(courierOrder)}
        cancelOrderLoading={cancelling}
        cancelOrderText={t('orders.modal.cancelOrder')}
      />
    </div>
  );
}
