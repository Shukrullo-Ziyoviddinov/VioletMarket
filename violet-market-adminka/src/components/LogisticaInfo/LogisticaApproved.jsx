import React from 'react';
import { Empty, Table, Typography } from 'antd';
import './LogisticaInfo.css';

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ');
}

export default function LogisticaApproved({ profiles, loading }) {
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
      title: 'Tasdiqlangan vaqt',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      width: 180,
      render: (value) => formatDate(value),
    },
  ];

  return (
    <section className="logistica-info-section">
      <div className="logistica-info-section__head">
        <Title level={4} className="logistica-info-section__title">
          Tasdiqlangan logistica
        </Title>
        <Text type="secondary">Faol logistica hisoblari ro‘yxati.</Text>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={profiles}
        loading={loading}
        pagination={false}
        scroll={{ x: 900 }}
        locale={{
          emptyText: (
            <Empty description="Hozircha tasdiqlangan logistica yo‘q" />
          ),
        }}
      />
    </section>
  );
}
