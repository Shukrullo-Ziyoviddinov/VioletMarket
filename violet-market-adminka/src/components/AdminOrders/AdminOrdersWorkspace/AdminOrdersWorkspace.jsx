import React, { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import {
  deliverAdminNoAnswerOrder,
  fetchAdminOrders,
  handoffAdminOrderItem,
  reactivateAdminNoAnswerOrder,
  reHandoffAdminNoAnswerOrder,
} from '../../../api/adminOrdersApi';
import { useAdminModal } from '../../../context/AdminModalContext';
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

export default function AdminOrdersWorkspace({
  filter = 'confirmation',
  onStatusChanged,
}) {
  const { openAdminModal } = useAdminModal();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courierOrder, setCourierOrder] = useState(null);
  const [handingOff, setHandingOff] = useState(false);
  const requestIdRef = useRef(0);

  const loadOrders = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    try {
      const trackingStatus = FILTER_STATUS[filter] || 'accepted';
      const data = await fetchAdminOrders({
        page: 1,
        limit: 100,
        trackingStatus,
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
  }, [filter]);

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
  }, [filter]);

  const openOrderDetail = (order, mode) => {
    openAdminModal({
      key: 'admin-order-detail',
      label: order?.orderCode
        ? `Buyurtma #${order.orderCode} · ${order?.seller?.name || order?.sellerId || 'Siller'}`
        : 'Buyurtma tafsiloti',
      order,
      mode,
      onSuccess: refreshAfterStatusChange,
    });
  };

  const handleCourierHandoff = async () => {
    if (!courierOrder || handingOff) return;

    setHandingOff(true);
    try {
      await handoffAdminOrderItem(
        courierOrder.orderId,
        courierOrder.itemIndex,
        courierOrder.sellerId,
      );
      message.success(
        `${courierOrder?.seller?.name || 'Siller'} · mahsulot kuryerga topshirildi`,
      );
      setCourierOrder(null);
      await refreshAfterStatusChange();
    } catch (error) {
      message.error(error?.message || "Kuryerga topshirib bo'lmadi");
    } finally {
      setHandingOff(false);
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
      />
    );
  } else if (filter === 'collection') {
    listNode = (
      <AdminOrderCollectionList
        orders={orders}
        loading={loading}
        onOpenOrder={(order) => openOrderDetail(order, 'collect')}
      />
    );
  } else if (filter === 'courier') {
    listNode = (
      <AdminOrderCourierList
        orders={orders}
        loading={loading}
        onOpenOrder={setCourierOrder}
      />
    );
  } else if (filter === 'handed') {
    listNode = <AdminOrderHandedList orders={orders} loading={loading} />;
  } else if (filter === 'noAnswer') {
    listNode = (
      <AdminOrderNoAnswerList
        orders={orders}
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

      <AdminOrderHandoffModal
        open={Boolean(courierOrder)}
        order={courierOrder}
        loading={handingOff}
        onClose={() => {
          if (!handingOff) setCourierOrder(null);
        }}
        onConfirm={handleCourierHandoff}
      />
    </div>
  );
}
