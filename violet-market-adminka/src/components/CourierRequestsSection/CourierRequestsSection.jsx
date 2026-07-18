import React, { useCallback, useState } from 'react';
import { Button, Empty, Popconfirm, Space, Table, Typography } from 'antd';
import { approveCourier, rejectCourier } from '../../api/couriersAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import './CourierRequestsSection.css';

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ');
}

export default function CourierRequestsSection({ applications, loading, onChanged }) {
  const { showToast } = useAdminToast();
  const [actionId, setActionId] = useState('');

  const handleApprove = useCallback(
    async (courierId) => {
      setActionId(courierId);
      try {
        await approveCourier(courierId);
        showToast({ type: 'success', message: 'Kuryer so‘rovi tasdiqlandi' });
        onChanged?.();
      } catch (err) {
        showToast({ type: 'error', message: err.message || 'Tasdiqlash amalga oshmadi' });
      } finally {
        setActionId('');
      }
    },
    [onChanged, showToast],
  );

  const handleReject = useCallback(
    async (courierId) => {
      setActionId(courierId);
      try {
        await rejectCourier(courierId);
        showToast({ type: 'success', message: 'Kuryer so‘rovi bekor qilindi' });
        onChanged?.();
      } catch (err) {
        showToast({ type: 'error', message: err.message || 'Bekor qilish amalga oshmadi' });
      } finally {
        setActionId('');
      }
    },
    [onChanged, showToast],
  );

  const columns = [
    {
      title: 'Ism',
      dataIndex: 'firstName',
      key: 'firstName',
      width: 140,
    },
    {
      title: 'Familiya',
      dataIndex: 'lastName',
      key: 'lastName',
      width: 140,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
    },
    {
      title: 'Gmail',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: 'Yuborilgan vaqt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value) => formatDate(value),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Button
            type="primary"
            size="small"
            loading={actionId === record.id}
            onClick={() => handleApprove(record.id)}
          >
            Tasdiqlash
          </Button>
          <Popconfirm
            title="So‘rovni bekor qilasizmi?"
            okText="Ha"
            cancelText="Yo'q"
            onConfirm={() => handleReject(record.id)}
          >
            <Button danger size="small" loading={actionId === record.id}>
              Bekor qilish
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <section className="courier-requests-section">
      <div className="courier-requests-section__head">
        <Title level={4} className="courier-requests-section__title">
          Yangi kuryer so‘rovlari
        </Title>
        <Text type="secondary">
          Delivery admindan yuborilgan yangi so‘rovlarni ko‘rib chiqing
        </Text>
      </div>

      <Table
        className="couriers-admin-table"
        rowKey="id"
        size="small"
        tableLayout="fixed"
        columns={columns}
        dataSource={applications}
        loading={loading}
        pagination={false}
        locale={{ emptyText: <Empty description="Hozircha yangi so‘rov yo‘q" /> }}
        scroll={applications.length ? { x: 1060 } : undefined}
      />
    </section>
  );
}
