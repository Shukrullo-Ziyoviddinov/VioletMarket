import React, { useCallback, useState } from 'react';
import { Button, Empty, Popconfirm, Space, Table, Typography } from 'antd';
import {
  approveLogistica,
  rejectLogistica,
} from '../../api/logisticaAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import './LogisticaInfo.css';

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ');
}

export default function LogisticaRequests({ applications, loading, onChanged }) {
  const { showToast } = useAdminToast();
  const [actionId, setActionId] = useState('');

  const handleApprove = useCallback(
    async (id) => {
      setActionId(id);
      try {
        await approveLogistica(id);
        showToast({ type: 'success', message: 'Logistica so‘rovi tasdiqlandi' });
        onChanged?.();
      } catch (err) {
        showToast({
          type: 'error',
          message: err.message || 'Tasdiqlash amalga oshmadi',
        });
      } finally {
        setActionId('');
      }
    },
    [onChanged, showToast],
  );

  const handleReject = useCallback(
    async (id) => {
      setActionId(id);
      try {
        await rejectLogistica(id);
        showToast({ type: 'success', message: 'Logistica so‘rovi bekor qilindi' });
        onChanged?.();
      } catch (err) {
        showToast({
          type: 'error',
          message: err.message || 'Bekor qilish amalga oshmadi',
        });
      } finally {
        setActionId('');
      }
    },
    [onChanged, showToast],
  );

  const columns = [
    {
      title: 'Kompaniya nomi',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
    },
    {
      title: 'Davlat',
      dataIndex: 'countryLabel',
      key: 'countryLabel',
      width: 140,
    },
    {
      title: 'Type key',
      dataIndex: 'logisticaCountry',
      key: 'logisticaCountry',
      width: 120,
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
    <section className="logistica-info-section">
      <div className="logistica-info-section__head">
        <Title level={4} className="logistica-info-section__title">
          Ro‘yxatdan o‘tgan logistica so‘rovlari
        </Title>
        <Text type="secondary">
          Tasdiqlash hisobni faollashtiradi, bekor qilish so‘rovni o‘chiradi.
        </Text>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={applications}
        loading={loading}
        pagination={false}
        scroll={{ x: 1000 }}
        locale={{
          emptyText: (
            <Empty description="Hozircha logistica so‘rovlari yo‘q" />
          ),
        }}
      />
    </section>
  );
}
