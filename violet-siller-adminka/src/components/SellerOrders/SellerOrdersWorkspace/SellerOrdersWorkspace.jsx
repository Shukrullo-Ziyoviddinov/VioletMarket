import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  cancelSellerOrderItem,
  collectSellerOrderItem,
  confirmSellerOrderItem,
  deliverSellerNoAnswerOrder,
  fetchSellerCargoWarehouseContacts,
  fetchSellerOrders,
  handoffSellerOrderItem,
  reactivateSellerNoAnswerOrder,
  reHandoffSellerNoAnswerOrder,
  submitSellerOrderItemToCargo,
} from '../../../api/sellerOrdersApi';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import MiniGlobalModal from '../../MiniGlobalModal/MiniGlobalModal';
import SellerCargoWarehouseContacts from '../SellerCargoWarehouseContacts/SellerCargoWarehouseContacts';
import SellerOrderCargoHandedList from '../SellerOrderCargoHandedList/SellerOrderCargoHandedList';
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
  cargo: 'collected',
  cargoHanded: 'ready_for_cargo',
};

async function fetchOrdersForFilter(token, filter) {
  if (filter === 'cargoHanded') {
    const [ready, handed] = await Promise.all([
      fetchSellerOrders(token, {
        page: 1,
        limit: 100,
        trackingStatus: 'ready_for_cargo',
      }),
      fetchSellerOrders(token, {
        page: 1,
        limit: 100,
        trackingStatus: 'handed_to_cargo',
      }),
    ]);
    const merged = [
      ...(Array.isArray(ready?.orders) ? ready.orders : []),
      ...(Array.isArray(handed?.orders) ? handed.orders : []),
    ];
    const seen = new Set();
    return merged.filter((row) => {
      const key = String(row?.id || '');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const trackingStatus = FILTER_STATUS[filter] || 'accepted';
  const data = await fetchSellerOrders(token, {
    page: 1,
    limit: 100,
    trackingStatus,
  });
  return Array.isArray(data?.orders) ? data.orders : [];
}

export default function SellerOrdersWorkspace({ filter = 'confirmation' }) {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [courierOrder, setCourierOrder] = useState(null);
  const [cargoOrder, setCargoOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [handingOff, setHandingOff] = useState(false);
  const [submittingCargo, setSubmittingCargo] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cargoContactsLoading, setCargoContactsLoading] = useState(false);
  const [cargoContactsError, setCargoContactsError] = useState('');
  const [cargoContacts, setCargoContacts] = useState([]);
  const [cargoCountry, setCargoCountry] = useState('');

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setOrders(await fetchOrdersForFilter(token, filter));
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
    setCargoOrder(null);
    setCancelTarget(null);
    setCargoContacts([]);
    setCargoContactsError('');
    setCargoCountry('');
  }, [filter]);

  useEffect(() => {
    if (!token || !cargoOrder) {
      setCargoContacts([]);
      setCargoContactsError('');
      setCargoCountry('');
      setCargoContactsLoading(false);
      return undefined;
    }

    let active = true;
    setCargoContactsLoading(true);
    setCargoContactsError('');

    fetchSellerCargoWarehouseContacts(token)
      .then((data) => {
        if (!active) return;
        setCargoContacts(data.contacts || []);
        setCargoCountry(data.sellerCountry || '');
      })
      .catch(() => {
        if (!active) return;
        setCargoContacts([]);
        setCargoContactsError(
          t('orders.cargo.warehouseContacts.loadError'),
        );
      })
      .finally(() => {
        if (active) setCargoContactsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cargoOrder, t, token]);

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
  const cargoReadyOrders = orders.filter(
    (order) => order.trackingStatus === 'collected',
  );
  const cargoHandedOrders = orders.filter(
    (order) =>
      order.trackingStatus === 'ready_for_cargo' ||
      order.trackingStatus === 'handed_to_cargo',
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
      message.success(
        t('orders.courier.success', { defaultValue: 'Mahsulot kuryerga topshirildi' }),
      );
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

  const handleCargoSubmit = async () => {
    if (!token || !cargoOrder || submittingCargo) return;

    setSubmittingCargo(true);
    try {
      await submitSellerOrderItemToCargo(
        token,
        cargoOrder.orderId,
        cargoOrder.itemIndex,
      );
      message.success(
        t('orders.cargo.success', {
          defaultValue: 'Mahsulot cargoga yuborildi',
        }),
      );
      setCargoOrder(null);
      await loadOrders();
    } catch (error) {
      message.error(
        error?.message ||
          t('orders.cargo.error', { defaultValue: 'Cargoga yuborib bo‘lmadi' }),
      );
      throw error;
    } finally {
      setSubmittingCargo(false);
    }
  };

  const handleCancelOrder = async () => {
    const order = cancelTarget;
    if (!token || !order || cancelling) return;

    setCancelling(true);
    try {
      await cancelSellerOrderItem(token, order.orderId, order.itemIndex);
      message.success(t('orders.cancel.success'));
      setCancelTarget(null);
      setActiveOrder(null);
      setCourierOrder(null);
      setCargoOrder(null);
      await loadOrders();
    } catch (error) {
      message.error(error?.message || t('orders.cancel.error'));
    } finally {
      setCancelling(false);
    }
  };

  const requestCancelOrder = (targetOrder) => {
    if (!targetOrder || cancelling || handingOff || submittingCargo) return;
    setCancelTarget(targetOrder);
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
  } else if (filter === 'cargo') {
    listNode = (
      <SellerOrderCourierList
        orders={cargoReadyOrders}
        loading={loading}
        onOpenOrder={setCargoOrder}
        emptyKey="orders.cargo.empty"
      />
    );
  } else if (filter === 'handed') {
    listNode = (
      <SellerOrderHandedList orders={handedOrders} loading={loading} />
    );
  } else if (filter === 'cargoHanded') {
    listNode = (
      <SellerOrderCargoHandedList orders={cargoHandedOrders} loading={loading} />
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
          filter === 'collection' &&
          activeOrder?.trackingStatus === 'seller_confirmed'
        }
        collecting={collecting}
        onCollect={handleCollect}
        showCancelOrder={
          (filter === 'confirmation' && activeOrder?.trackingStatus === 'accepted') ||
          (filter === 'collection' &&
            activeOrder?.trackingStatus === 'seller_confirmed')
        }
        cancelling={cancelling}
        onCancelOrder={() => requestCancelOrder(activeOrder)}
      />

      <MiniGlobalModal
        open={Boolean(courierOrder)}
        permissionKey="courierHandoff"
        loading={handingOff}
        onClose={() => {
          if (!handingOff && !cancelling) setCourierOrder(null);
        }}
        onConfirm={handleCourierHandoff}
        onCancelOrder={() => requestCancelOrder(courierOrder)}
        cancelOrderText={t('orders.modal.cancelOrder')}
      />

      <MiniGlobalModal
        open={Boolean(cargoOrder)}
        permissionKey="cargoHandoff"
        loading={submittingCargo}
        onClose={() => {
          if (!submittingCargo && !cancelling) setCargoOrder(null);
        }}
        onConfirm={handleCargoSubmit}
        onCancelOrder={() => requestCancelOrder(cargoOrder)}
        cancelOrderText={t('orders.modal.cancelOrder')}
        extraContent={
          <SellerCargoWarehouseContacts
            loading={cargoContactsLoading}
            error={cargoContactsError}
            sellerCountry={cargoCountry}
            contacts={cargoContacts}
          />
        }
      />

      <MiniGlobalModal
        open={Boolean(cancelTarget)}
        permissionKey="cancelOrder"
        loading={cancelling}
        onClose={() => {
          if (!cancelling) setCancelTarget(null);
        }}
        onConfirm={handleCancelOrder}
      />
    </div>
  );
}
