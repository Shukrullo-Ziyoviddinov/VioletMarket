import React, { useCallback, useState } from 'react';
import { Button, Empty, Popconfirm, Space, Table, Typography } from 'antd';
import {
  approveSellerApplication,
  rejectSellerApplication,
} from '../../api/sellersAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import SellerTableExpandedRow from '../SellerTableExpandedRow/SellerTableExpandedRow';
import {
  buildActionsColumn,
  buildEmailColumn,
  buildFirstNameColumn,
  buildLastNameColumn,
  buildSellerCountryColumn,
  buildShopDisplayNameColumn,
  buildShopIdColumn,
  buildSubmittedAtColumn,
  getSellersTableScrollX,
} from '../SellersTable/sellersTableColumns';
import '../SellersTable/SellersTable.css';
import './SellerApplicationsSection.css';

const { Title, Text } = Typography;

const PENDING_COLUMN_KEYS = [
  'firstName',
  'lastName',
  'email',
  'shopDisplayName',
  'shopId',
  'sellerCountry',
  'submittedAt',
  'actions',
];

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
    buildFirstNameColumn(),
    buildLastNameColumn(),
    buildEmailColumn(),
    buildShopDisplayNameColumn(),
    buildShopIdColumn(),
    buildSellerCountryColumn(),
    buildSubmittedAtColumn(),
    buildActionsColumn((_, record) => (
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
    )),
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
        className="sellers-admin-table"
        rowKey="id"
        size="small"
        tableLayout="fixed"
        columns={columns}
        dataSource={applications}
        loading={loading}
        pagination={false}
        expandable={{
          expandedRowRender: (record) => <SellerTableExpandedRow record={record} />,
        }}
        locale={{ emptyText: <Empty description="Hozircha yangi ariza yo'q" /> }}
        scroll={{ x: getSellersTableScrollX(PENDING_COLUMN_KEYS) }}
      />
    </section>
  );
}
