import React, { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import {
  cancelAdminOrderGroup,
  cancelAdminOrderItem,
  deliverAdminNoAnswerOrder,
  fetchAdminOrders,
  handoffAdminOrderGroup,
  handoffAdminOrderItem,
  reactivateAdminNoAnswerOrder,
  reHandoffAdminNoAnswerOrder,
} from '../../../api/adminOrdersApi';
import { useAdminModal } from '../../../context/AdminModalContext';
import MiniGlobalModal from '../../MiniGlobalModal/MiniGlobalModal';
import AdminOrderCollectionList from '../AdminOrderCollectionList/AdminOrderCollectionList';
import AdminOrderCourierList from '../AdminOrderCourierList/AdminOrderCourierList';
import AdminOrderHandedList from '../AdminOrderHandedList/AdminOrderHandedList';
import AdminOrderHandoffModal from '../AdminOrderHandoffModal/AdminOrderHandoffModal';
import AdminOrderNoAnswerList from '../AdminOrderNoAnswerList/AdminOrderNoAnswerList';
import AdminOrdersList from '../AdminOrdersList/AdminOrdersList';
import './AdminOrdersWorkspace.css';

const FILTER_STATUS = {
  confirmation: 'accepted',
  collection: 'seller_confirmed',
  courier: 'collected',
  handed: 'handed_to_courier',
  noAnswer: 'no_answer',
};

/** Xorij → UZB: kuryer tab = Toshkent omboridagi handed_to_cargo */
const FOREIGN_FILTER_STATUS = {
  courier: 'handed_to_cargo',
  handed: 'handed_to_courier',
  noAnswer: 'no_answer',
};

function resolveItemIndexes(order) {
  if (Array.isArray(order?.itemIndexes) && order.itemIndexes.length) {
    return [...new Set(order.itemIndexes.map((value) => Number(value) || 0))];
  }
  return [Number(order?.itemIndex) || 0];
}

export default function AdminOrdersWorkspace({
  filter = 'confirmation',
  onStatusChanged,
  pipeline,
  allowHandoff = true,
  showSellerCountry = false,
}) {
  const { openAdminModal } = useAdminModal();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courierOrder, setCourierOrder] = useState(null);
  const [handingOff, setHandingOff] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const requestIdRef = useRef(0);

  const loadOrders = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    try {
      const statusMap =
        pipeline === 'foreign' ? FOREIGN_FILTER_STATUS : FILTER_STATUS;
      const trackingStatus = statusMap[filter] || FILTER_STATUS[filter] || 'accepted';
      const data = await fetchAdminOrders({
        page: 1,
        limit: 200,
        trackingStatus,
        ...(pipeline ? { pipeline } : {}),
        ...(pipeline === 'foreign' && filter === 'courier'
          ? { uzWarehouseReady: true }
          : {}),
      });
      if (requestIdRef.current !== requestId) return;
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setOrders([]);
      message.error(error?.message || "Buyurtmalarni yuklab bo'lmadi");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [filter, pipeline]);

  const refreshAfterStatusChange = useCallback(async () => {
    await loadOrders();
    onStatusChanged?.();
  }, [loadOrders, onStatusChanged]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setOrders([]);
    setCourierOrder(null);
    setCancelConfirmOpen(false);
  }, [filter, pipeline]);

  const openOrderDetail = (order, mode) => {
    const productLabel = order?.isGroup
      ? `${order.productCount || order.items?.length || 1} ta mahsulot`
      : order?.productCode || '';
    openAdminModal({
      key: 'admin-order-detail',
      label: order?.orderCode
        ? `Buyurtma ${order.orderCode} · ${order?.seller?.name || order?.sellerId || 'Siller'}${
            productLabel ? ` · ${productLabel}` : ''
          }`
        : 'Buyurtma tafsiloti',
      order,
      mode,
      onSuccess: refreshAfterStatusChange,
    });
  };

  const handleCourierHandoff = async (pickup) => {
    if (!allowHandoff || !courierOrder || handingOff || cancelling) return;

    const itemIndexes = resolveItemIndexes(courierOrder);
    const isGroup =
      Boolean(courierOrder.isGroup) || itemIndexes.length > 1;
    const requireWarehousePickup = pipeline === 'foreign';

    setHandingOff(true);
    try {
      let updatedCount = 0;
      let skippedCount = 0;

      if (isGroup || requireWarehousePickup) {
        // Local group yoki xorij (1+): server group bridge — bir xil ombor pickup.
        const result = await handoffAdminOrderGroup(
          courierOrder.orderId,
          courierOrder.sellerId,
          {
            itemIndexes,
            cargoServiceType: courierOrder.cargoServiceType,
            ...(requireWarehousePickup ? { pickup } : {}),
          },
        );
        updatedCount = Number(result?.updatedCount) || 0;
        skippedCount = Number(result?.skippedCount) || 0;
      } else {
        await handoffAdminOrderItem(
          courierOrder.orderId,
          itemIndexes[0],
          courierOrder.sellerId,
          pickup,
        );
        updatedCount = 1;
      }

      if (updatedCount <= 0) {
        message.warning('Topshirish uchun tayyor mahsulot yo‘q');
        await refreshAfterStatusChange();
        return;
      }

      const base = `${courierOrder?.seller?.name || 'Siller'} · ${
        isGroup ? 'mahsulotlar' : 'mahsulot'
      } kuryerga topshirildi`;
      message.success(
        skippedCount > 0
          ? `${base} (${skippedCount} ta o‘tkazib yuborildi)`
          : base,
      );
      setCourierOrder(null);
      await refreshAfterStatusChange();
    } catch (error) {
      message.error(error?.message || "Kuryerga topshirib bo'lmadi");
    } finally {
      setHandingOff(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!courierOrder || handingOff || cancelling) return;
    const itemIndexes = resolveItemIndexes(courierOrder);
    const isGroup =
      Boolean(courierOrder.isGroup) || itemIndexes.length > 1;

    setCancelling(true);
    try {
      let result;
      if (isGroup) {
        result = await cancelAdminOrderGroup(
          courierOrder.orderId,
          courierOrder.sellerId,
          { itemIndexes },
        );
      } else {
        await cancelAdminOrderItem(
          courierOrder.orderId,
          itemIndexes[0],
          courierOrder.sellerId,
        );
        result = { updatedCount: 1, skippedCount: 0 };
      }

      if (Number(result?.updatedCount) <= 0) {
        message.warning('Bekor qilish uchun tayyor mahsulot yo‘q');
        await refreshAfterStatusChange();
        return;
      }

      const skippedCount = Number(result?.skippedCount) || 0;
      const base = isGroup
        ? 'Mahsulotlar bekor qilindi, omborga qaytdi'
        : 'Buyurtma bekor qilindi, mahsulot omborga qaytdi';
      message.success(
        skippedCount > 0
          ? `${base} (${skippedCount} ta o‘tkazib yuborildi)`
          : base,
      );
      setCancelConfirmOpen(false);
      setCourierOrder(null);
      await refreshAfterStatusChange();
    } catch (error) {
      message.error(error?.message || 'Buyurtmani bekor qilib bo‘lmadi');
    } finally {
      setCancelling(false);
    }
  };

  const handleNoAnswerReHandoff = async (order) => {
    if (!order?.id) return;
    try {
      await reHandoffAdminNoAnswerOrder(order.id);
      message.success('Buyurtma qayta kuryerga topshirildi');
      await refreshAfterStatusChange();
    } catch (error) {
      message.error(error?.message || 'Amal bajarilmadi');
    }
  };

  const handleNoAnswerReactivate = async (order) => {
    if (!order?.id) return;
    try {
      await reactivateAdminNoAnswerOrder(order.id);
      message.success('Mahsulot qayta sotuvga qo‘yildi');
      await refreshAfterStatusChange();
    } catch (error) {
      message.error(error?.message || 'Amal bajarilmadi');
    }
  };

  const handleNoAnswerDeliver = async (order) => {
    if (!order?.id) return;
    try {
      await deliverAdminNoAnswerOrder(order.id);
      message.success('Buyurtma mijozga topshirildi deb belgilandi');
      await refreshAfterStatusChange();
    } catch (error) {
      message.error(error?.message || 'Amal bajarilmadi');
    }
  };

  let listNode = null;
  if (filter === 'confirmation') {
    listNode = (
      <AdminOrdersList
        orders={orders}
        loading={loading}
        onOpenOrder={(order) => openOrderDetail(order, 'confirm')}
        groupByFulfillment
      />
    );
  } else if (filter === 'collection') {
    listNode = (
      <AdminOrderCollectionList
        orders={orders}
        loading={loading}
        onOpenOrder={(order) => openOrderDetail(order, 'collect')}
        groupByFulfillment
      />
    );
  } else if (filter === 'courier') {
    listNode = (
      <AdminOrderCourierList
        orders={orders}
        loading={loading}
        onOpenOrder={setCourierOrder}
        showSellerCountry={showSellerCountry}
        groupByFulfillment
        emptyDescription={
          pipeline === 'foreign'
            ? 'To‘langan (Toshkent ombori) xorij mahsulotlari yo‘q'
            : undefined
        }
      />
    );
  } else if (filter === 'handed') {
    listNode = (
      <AdminOrderHandedList
        orders={orders}
        loading={loading}
        showSellerCountry={showSellerCountry}
        groupByFulfillment
      />
    );
  } else if (filter === 'noAnswer') {
    listNode = (
      <AdminOrderNoAnswerList
        orders={orders}
        loading={loading}
        showSellerCountry={showSellerCountry}
        onReHandoff={handleNoAnswerReHandoff}
        onReactivate={handleNoAnswerReactivate}
        onDeliver={handleNoAnswerDeliver}
      />
    );
  }

  return (
    <div className="seller-orders-workspace">
      {listNode}

      <AdminOrderHandoffModal
        open={Boolean(courierOrder)}
        order={courierOrder}
        loading={handingOff}
        cancelling={cancelling}
        allowHandoff={allowHandoff}
        requireWarehousePickup={pipeline === 'foreign'}
        onClose={() => {
          if (!handingOff && !cancelling) setCourierOrder(null);
        }}
        onConfirm={handleCourierHandoff}
        onCancelOrder={
          allowHandoff
            ? () => {
                if (!handingOff && !cancelling) setCancelConfirmOpen(true);
              }
            : undefined
        }
      />

      <MiniGlobalModal
        open={cancelConfirmOpen}
        mode="confirm"
        permissionKey="cancelOrder"
        loading={cancelling}
        onConfirm={handleCancelOrder}
        onCancel={() => {
          if (!cancelling) setCancelConfirmOpen(false);
        }}
      />
    </div>
  );
}
