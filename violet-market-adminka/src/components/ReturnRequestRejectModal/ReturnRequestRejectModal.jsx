import React, { useState } from 'react';
import { Input, Modal, message } from 'antd';
import { rejectReturnRequest } from '../../api/returnRequestAdminApi';

export default function ReturnRequestRejectModal({
  open,
  item,
  onClose,
  onSuccess,
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOk = async () => {
    if (!item?.id) return;
    setSubmitting(true);
    try {
      await rejectReturnRequest(item.id, rejectReason.trim());
      message.success('So‘rov rad etildi');
      setRejectReason('');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      message.error(err.message || 'Rad etishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="So‘rovni rad etish"
      okText="Rad etish"
      cancelText="Bekor"
      okButtonProps={{ danger: true }}
      onCancel={() => {
        setRejectReason('');
        onClose?.();
      }}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
    >
      <p style={{ marginBottom: 8, color: '#5b5268' }}>
        Kuryer yana mijozga topshirishni davom ettirishi mumkin.
      </p>
      <Input.TextArea
        rows={3}
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        placeholder="Rad sababi (ixtiyoriy)"
      />
    </Modal>
  );
}
