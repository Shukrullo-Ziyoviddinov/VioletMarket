import React, { useState } from 'react';
import { Modal, Radio, Space, message } from 'antd';
import { approveReturnRequest } from '../../api/returnRequestAdminApi';
import './ReturnRequestApproveModal.css';

export default function ReturnRequestApproveModal({
  open,
  item,
  onClose,
  onSuccess,
}) {
  const [reasonType, setReasonType] = useState('return');
  const [submitting, setSubmitting] = useState(false);

  const handleOk = async () => {
    if (!item?.id) return;
    if (reasonType === 'no_answer' && !item.isPaid) {
      message.error("To‘lov qilinmagan buyurtmada «Javob bermadi» tanlab bo‘lmaydi");
      return;
    }
    setSubmitting(true);
    try {
      await approveReturnRequest(item.id, reasonType);
      message.success('So‘rov tasdiqlandi');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      message.error(err.message || 'Tasdiqlashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Qaytarish so‘rovini tasdiqlash"
      okText="Tasdiqlash"
      cancelText="Bekor"
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      className="return-request-approve-modal"
    >
      <p className="return-request-approve-modal__hint">
        Kuryerda qaysi tugma ishlashini belgilang:
      </p>
      <Radio.Group
        value={reasonType}
        onChange={(e) => setReasonType(e.target.value)}
      >
        <Space direction="vertical">
          <Radio value="return">Qaytarish (omborga qaytadi)</Radio>
          <Radio value="no_answer" disabled={!item?.isPaid}>
            Javob bermadi {!item?.isPaid ? '(faqat to‘langan)' : ''}
          </Radio>
          <Radio value="defective">
            Yaroqsiz (omborga kirmaydi, sotilmagan)
          </Radio>
        </Space>
      </Radio.Group>
    </Modal>
  );
}
