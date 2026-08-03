import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  cancelSellerOrderGroup,
  cancelSellerOrderItem,
  collectSellerOrderGroup,
  collectSellerOrderItem,
  confirmSellerOrderGroup,
  confirmSellerOrderItem,
  deliverSellerNoAnswerOrder,
  fetchSellerCargoWarehouseContacts,
  fetchSellerOrders,
  handoffSellerOrderGroup,
  handoffSellerOrderItem,
  markUnavailableSellerOrderItem,
  reactivateSellerNoAnswerOrder,
  reHandoffSellerNoAnswerOrder,
  submitSellerOrderGroupToCargo,
  submitSellerOrderItemToCargo,
} from '../../../api/sellerOrdersApi';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import MiniGlobalModal from '../../MiniGlobalModal/MiniGlobalModal';
import SellerCargoWarehouseContacts from '../SellerCargoWarehouseContacts/SellerCargoWarehouseContacts';
import SellerOrderCargoHandedList from '../SellerOrderCargoHandedList/SellerOrderCargoHandedList';
import SellerOrderCollectionList from '../SellerOrderCollectionList/SellerOrderCollectionList';
import SellerOrderCourierList from '../SellerOrderCourierList/SellerOrderCourierList';
import SellerOrderGroupItems from '../SellerOrderGroupItems/SellerOrderGroupItems';
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
        limit: 200,
        trackingStatus: 'ready_for_cargo',
      }),
      fetchSellerOrders(token, {
        page: 1,
        limit: 200,
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
    limit: 200,
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
  const [markingUnavailable, setMarkingUnavailable] = useState(false);
  const [unavailableTarget, setUnavailableTarget] = useState(null);
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

    const orderId = Number(activeOrder.orderId) || 0;
    const itemIndexes = Array.isArray(activeOrder.itemIndexes)
      ? activeOrder.itemIndexes
      : [Number(activeOrder.itemIndex) || 0];
    const uniqueIndexes = [...new Set(itemIndexes.map((value) => Number(value) || 0))];
    const isGroup = uniqueIndexes.length > 1 || Boolean(activeOrder.isGroup);

    setConfirming(true);
    try {
      let result;
      if (isGroup) {
        result = await confirmSellerOrderGroup(token, orderId, {
          itemIndexes: uniqueIndexes,
        });
      } else {
        await confirmSellerOrderItem(token, orderId, uniqueIndexes[0]);
        result = { updatedCount: 1, skippedCount: 0 };
      }

      const updatedCount = Number(result?.updatedCount);
      const skippedCount = Number(result?.skippedCount) || 0;
      if (Number.isFinite(updatedCount) && updatedCount <= 0) {
        message.warning(
          t('orders.confirm.noneReady', {
            defaultValue: 'Tasdiqlash uchun tayyor mahsulot yo‘q',
          }),
        );
        await loadOrders();
        return;
      }

      const base = t('orders.confirm.success');
      message.success(
        skippedCount > 0
          ? `${base} (${skippedCount} ta o‘tkazib yuborildi)`
          : base,
      );
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

    const orderId = Number(activeOrder.orderId) || 0;
    const itemIndexes = Array.isArray(activeOrder.itemIndexes)
      ? activeOrder.itemIndexes
      : [Number(activeOrder.itemIndex) || 0];
    const uniqueIndexes = [...new Set(itemIndexes.map((value) => Number(value) || 0))];
    const isGroup = uniqueIndexes.length > 1 || Boolean(activeOrder.isGroup);

    setCollecting(true);
    try {
      let result;
      if (isGroup) {
        result = await collectSellerOrderGroup(token, orderId, {
          itemIndexes: uniqueIndexes,
        });
      } else {
        await collectSellerOrderItem(token, orderId, uniqueIndexes[0]);
        result = { updatedCount: 1, skippedCount: 0 };
      }

      const updatedCount = Number(result?.updatedCount);
      const skippedCount = Number(result?.skippedCount) || 0;
      if (Number.isFinite(updatedCount) && updatedCount <= 0) {
        message.warning(
          t('orders.collect.noneReady', {
            defaultValue: 'Yig‘ish uchun tayyor mahsulot yo‘q',
          }),
        );
        await loadOrders();
        return;
      }

      const base = t('orders.collect.success');
      message.success(
        skippedCount > 0
          ? `${base} (${skippedCount} ta o‘tkazib yuborildi)`
          : base,
      );
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

    const orderId = Number(courierOrder.orderId) || 0;
    const itemIndexes = Array.isArray(courierOrder.itemIndexes)
      ? courierOrder.itemIndexes
      : [Number(courierOrder.itemIndex) || 0];
    const uniqueIndexes = [...new Set(itemIndexes.map((value) => Number(value) || 0))];

    setHandingOff(true);
    try {
      let result;
      if (uniqueIndexes.length > 1 || courierOrder.isGroup) {
        result = await handoffSellerOrderGroup(token, orderId, {
          itemIndexes: uniqueIndexes,
        });
      } else {
        result = await handoffSellerOrderItem(token, orderId, uniqueIndexes[0]);
        result = {
          updatedCount: 1,
          skippedCount: 0,
          ...result,
        };
      }

      const updatedCount = Number(result?.updatedCount);
      const skippedCount = Number(result?.skippedCount) || 0;
      if (Number.isFinite(updatedCount) && updatedCount <= 0) {
        message.warning(
          t('orders.courier.noneReady', {
            defaultValue: 'Topshirish uchun tayyor mahsulot yo‘q',
          }),
        );
        await loadOrders();
        return;
      }

      const baseSuccess = t('orders.courier.success', {
        defaultValue:
          uniqueIndexes.length > 1
            ? 'Mahsulotlar kuryerga topshirildi'
            : 'Mahsulot kuryerga topshirildi',
      });
      message.success(
        skippedCount > 0
          ? `${baseSuccess} (${skippedCount} ta o‘tkazib yuborildi)`
          : baseSuccess,
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

    const orderId = Number(cargoOrder.orderId) || 0;
    const itemIndexes = Array.isArray(cargoOrder.itemIndexes)
      ? cargoOrder.itemIndexes
      : [Number(cargoOrder.itemIndex) || 0];
    const uniqueIndexes = [...new Set(itemIndexes.map((value) => Number(value) || 0))];

    setSubmittingCargo(true);
    try {
      let result;
      if (uniqueIndexes.length > 1 || cargoOrder.isGroup) {
        result = await submitSellerOrderGroupToCargo(token, orderId, {
          itemIndexes: uniqueIndexes,
        });
      } else {
        result = await submitSellerOrderItemToCargo(
          token,
          orderId,
          uniqueIndexes[0],
        );
        result = {
          updatedCount: 1,
          skippedCount: 0,
          ...result,
        };
      }

      const updatedCount = Number(result?.updatedCount);
      const skippedCount = Number(result?.skippedCount) || 0;
      if (Number.isFinite(updatedCount) && updatedCount <= 0) {
        message.warning(
          t('orders.cargo.noneReady', {
            defaultValue: 'Cargoga yuborish uchun tayyor mahsulot yo‘q',
          }),
        );
        await loadOrders();
        return;
      }

      const baseSuccess = t('orders.cargo.success', {
        defaultValue:
          uniqueIndexes.length > 1
            ? 'Mahsulotlar cargoga yuborildi'
            : 'Mahsulot cargoga yuborildi',
      });
      message.success(
        skippedCount > 0
          ? `${baseSuccess} (${skippedCount} ta o‘tkazib yuborildi)`
          : baseSuccess,
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

    const orderId = Number(order.orderId) || 0;
    const itemIndexes = Array.isArray(order.itemIndexes)
      ? order.itemIndexes
      : [Number(order.itemIndex) || 0];
    const uniqueIndexes = [...new Set(itemIndexes.map((value) => Number(value) || 0))];
    const isGroup = uniqueIndexes.length > 1 || Boolean(order.isGroup);

    setCancelling(true);
    try {
      let result;
      if (isGroup) {
        result = await cancelSellerOrderGroup(token, orderId, {
          itemIndexes: uniqueIndexes,
        });
      } else {
        await cancelSellerOrderItem(token, orderId, uniqueIndexes[0]);
        result = { updatedCount: 1, skippedCount: 0 };
      }

      const updatedCount = Number(result?.updatedCount);
      const skippedCount = Number(result?.skippedCount) || 0;
      if (Number.isFinite(updatedCount) && updatedCount <= 0) {
        message.warning(
          t('orders.cancel.noneReady', {
            defaultValue: 'Bekor qilish uchun tayyor mahsulot yo‘q',
          }),
        );
        await loadOrders();
        return;
      }

      const base = t('orders.cancel.success');
      message.success(
        skippedCount > 0
          ? `${base} (${skippedCount} ta o‘tkazib yuborildi)`
          : base,
      );
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
    if (!targetOrder || cancelling || markingUnavailable || handingOff || submittingCargo) return;
    setCancelTarget(targetOrder);
  };

  const requestMarkUnavailable = (units) => {
    if (!activeOrder || cancelling || markingUnavailable) return;
    const list = (Array.isArray(units) ? units : [])
      .map((row) => ({
        itemIndex: Number(row?.itemIndex),
        unitIndex: Number(row?.unitIndex) || 0,
      }))
      .filter(
        (row) => Number.isInteger(row.itemIndex) && row.itemIndex >= 0,
      );
    if (!list.length) return;
    setUnavailableTarget({ order: activeOrder, units: list });
  };

  const handleMarkUnavailable = async () => {
    const target = unavailableTarget;
    if (!token || !target?.order || markingUnavailable) return;

    const orderId = Number(target.order.orderId) || 0;
    const units = Array.isArray(target.units) ? target.units : [];
    if (!orderId || !units.length) return;

    const byItemIndex = new Map();
    for (const unit of units) {
      const itemIndex = Number(unit.itemIndex);
      const unitIndex = Number(unit.unitIndex) || 0;
      if (!Number.isInteger(itemIndex) || itemIndex < 0) continue;
      if (!byItemIndex.has(itemIndex)) byItemIndex.set(itemIndex, []);
      byItemIndex.get(itemIndex).push(unitIndex);
    }
    if (!byItemIndex.size) return;

    setMarkingUnavailable(true);
    try {
      let refundCreated = false;
      for (const [itemIndex, unitIndexes] of byItemIndex.entries()) {
        const result = await markUnavailableSellerOrderItem(
          token,
          orderId,
          itemIndex,
          { unitIndexes },
        );
        if (result?.refundCreated) refundCreated = true;
      }
      const refundHint = refundCreated
        ? t('orders.unavailable.refundQueued', {
            defaultValue: ' To‘lov qaytarish admin sahifasiga tushdi.',
          })
        : '';
      message.success(
        `${t('orders.unavailable.success', {
          defaultValue: 'Mahsulot mavjud emas deb belgilandi (omborga qaytarilmadi)',
        })}${refundHint}`,
      );
      setUnavailableTarget(null);
      setActiveOrder(null);
      await loadOrders();
    } catch (error) {
      message.error(
        error?.message ||
          t('orders.unavailable.error', {
            defaultValue: 'Mavjud emas deb belgilab bo‘lmadi',
          }),
      );
    } finally {
      setMarkingUnavailable(false);
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
        groupByFulfillment
      />
    );
  } else if (filter === 'collection') {
    listNode = (
      <SellerOrderCollectionList
        orders={collectionOrders}
        loading={loading}
        onOpenOrder={setActiveOrder}
        groupByFulfillment
      />
    );
  } else if (filter === 'courier') {
    listNode = (
      <SellerOrderCourierList
        orders={courierOrders}
        loading={loading}
        onOpenOrder={setCourierOrder}
        groupByFulfillment
      />
    );
  } else if (filter === 'cargo') {
    listNode = (
      <SellerOrderCourierList
        orders={cargoReadyOrders}
        loading={loading}
        onOpenOrder={setCargoOrder}
        emptyKey="orders.cargo.empty"
        groupByFulfillment
      />
    );
  } else if (filter === 'handed') {
    listNode = (
      <SellerOrderHandedList
        orders={handedOrders}
        loading={loading}
        groupByFulfillment
      />
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
        showCancelOrder={filter === 'confirmation' || filter === 'collection'}
        cancelling={cancelling}
        onCancelOrder={() => requestCancelOrder(activeOrder)}
        showUnavailable={filter === 'confirmation' || filter === 'collection'}
        markingUnavailable={markingUnavailable}
        onMarkUnavailable={requestMarkUnavailable}
      />

      <MiniGlobalModal
        open={Boolean(courierOrder)}
        permissionKey="courierHandoff"
        loading={handingOff}
        itemName={
          courierOrder?.isGroup || (courierOrder?.itemIndexes || []).length > 1
            ? courierOrder?.orderCode || ''
            : courierOrder?.productCode || courierOrder?.orderCode || ''
        }
        onClose={() => {
          if (!handingOff && !cancelling) setCourierOrder(null);
        }}
        onConfirm={handleCourierHandoff}
        onCancelOrder={() => requestCancelOrder(courierOrder)}
        cancelOrderText={t('orders.modal.cancelOrder')}
        extraContent={<SellerOrderGroupItems order={courierOrder} />}
      />

      <MiniGlobalModal
        open={Boolean(cargoOrder)}
        permissionKey="cargoHandoff"
        loading={submittingCargo}
        itemName={
          cargoOrder?.isGroup || (cargoOrder?.itemIndexes || []).length > 1
            ? cargoOrder?.orderCode || ''
            : cargoOrder?.productCode || cargoOrder?.orderCode || ''
        }
        onClose={() => {
          if (!submittingCargo && !cancelling) setCargoOrder(null);
        }}
        onConfirm={handleCargoSubmit}
        onCancelOrder={() => requestCancelOrder(cargoOrder)}
        cancelOrderText={t('orders.modal.cancelOrder')}
        extraContent={
          <>
            <SellerOrderGroupItems order={cargoOrder} />
            <SellerCargoWarehouseContacts
              loading={cargoContactsLoading}
              error={cargoContactsError}
              sellerCountry={cargoCountry}
              contacts={cargoContacts}
            />
          </>
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

      <MiniGlobalModal
        open={Boolean(unavailableTarget)}
        permissionKey="markUnavailable"
        loading={markingUnavailable}
        onClose={() => {
          if (!markingUnavailable) setUnavailableTarget(null);
        }}
        onConfirm={handleMarkUnavailable}
      />
    </div>
  );
}
