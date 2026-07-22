import React, { useState } from 'react';
import { Button, InputNumber } from 'antd';
import { updateCourierAssignmentPayment } from '../../api/courierPaymentAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import './CourierAcceptedOrderPaymentEditor.css';

function formatAmount(value) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

export default function CourierAcceptedOrderPaymentEditor({
  order,
  editable = false,
  onUpdated,
}) {
  const { showToast } = useAdminToast();
  const [value, setValue] = useState(Number(order?.courierPayment) || 0);
  const [saving, setSaving] = useState(false);

  if (!editable || (order?.status !== 'delivered' && order?.status !== 'returned')) {
    return (
      <div className="courier-order-payment">
        <span className="courier-order-payment__label">Kuryer to‘lovi</span>
        <strong className="courier-order-payment__value">
          {formatAmount(order?.courierPayment)}
        </strong>
        {order?.distanceKm != null ? (
          <span className="courier-order-payment__meta">
            Masofa: {order.distanceKm} km
          </span>
        ) : null}
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateCourierAssignmentPayment(order.id, value);
      showToast({ type: 'success', message: 'Kuryer to‘lovi yangilandi' });
      onUpdated?.(updated);
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || 'To‘lovni saqlab bo‘lmadi',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="courier-order-payment courier-order-payment--editable">
      <span className="courier-order-payment__label">Kuryer to‘lovi</span>
      <div className="courier-order-payment__edit-row">
        <InputNumber
          min={0}
          step={1000}
          value={value}
          formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
          parser={(val) => Number(String(val || '').replace(/\s/g, ''))}
          onChange={(next) => setValue(Math.max(0, Number(next) || 0))}
        />
        <Button type="primary" size="small" loading={saving} onClick={handleSave}>
          Saqlash
        </Button>
      </div>
      {order?.distanceKm != null ? (
        <span className="courier-order-payment__meta">
          Masofa: {order.distanceKm} km
        </span>
      ) : null}
    </div>
  );
}
