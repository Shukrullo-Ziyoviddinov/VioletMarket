import React, { useCallback, useState } from 'react';
import { Button, Empty, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import {
  approveSellerApplication,
  rejectSellerApplication,
} from '../../api/sellersAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import './SellerApplicationsSection.css';

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uz-UZ');
}

export default function SellerApplicationsSection({ applications, loading, onChanged }) {
  const { showToast } = useAdminToast();
  const [actionId, setActionId] = useState('');

  const handleApprove = useCallback(
    async (applicationId) => {
      setActionId(applicationId);
      try {
        await approveSellerApplication(applicationId);
        showToast({ type: 'success', message: 'Ariza tasdiqlandi' });
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
    async (applicationId) => {
      setActionId(applicationId);
      try {
        await rejectSellerApplication(applicationId, 'Admin tomonidan rad etildi');
        showToast({ type: 'success', message: 'Ariza rad etildi' });
        onChanged?.();
      } catch (err) {
        showToast({ type: 'error', message: err.message || 'Rad etish amalga oshmadi' });
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
    },
    {
      title: 'Familiya',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'Gmail',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: "Do'kon nomi",
      dataIndex: 'shopDisplayName',
      key: 'shopDisplayName',
    },
    {
      title: "Do'kon ID",
      dataIndex: 'shopId',
      key: 'shopId',
      render: (value) => <Tag color="purple">{value}</Tag>,
    },
    {
      title: 'Yuborilgan',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: formatDate,
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            loading={actionId === record.id}
            onClick={() => handleApprove(record.id)}
          >
            Tasdiqlash
          </Button>
          <Popconfirm
            title="Arizani rad etasizmi?"
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
    <section className="seller-applications-section">
      <div className="seller-applications-section__head">
        <Title level={4} className="seller-applications-section__title">
          Kutilayotgan arizalar
        </Title>
        <Text type="secondary">Sotuvchi arizalarini ko&apos;rib chiqing va tasdiqlang</Text>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={applications}
        loading={loading}
        pagination={false}
        locale={{ emptyText: <Empty description="Hozircha yangi ariza yo'q" /> }}
        scroll={{ x: 980 }}
      />
    </section>
  );
}
