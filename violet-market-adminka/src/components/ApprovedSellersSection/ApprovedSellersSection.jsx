import React from 'react';
import { Empty, Table, Tag, Typography } from 'antd';
import './ApprovedSellersSection.css';

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uz-UZ');
}

export default function ApprovedSellersSection({ sellers, loading }) {
  const columns = [
    {
      title: "Do'kon ID",
      dataIndex: 'shopId',
      key: 'shopId',
      render: (value) => <Tag color="purple">{value}</Tag>,
    },
    {
      title: "Do'kon nomi",
      dataIndex: 'shopDisplayName',
      key: 'shopDisplayName',
    },
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
      title: 'Tasdiqlangan',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      render: formatDate,
    },
    {
      title: 'Obunachilar',
      key: 'subscriberCount',
      render: (_, record) => record?.sellerAccount?.subscriberCount ?? 0,
    },
  ];

  return (
    <section className="approved-sellers-section">
      <div className="approved-sellers-section__head">
        <Title level={4} className="approved-sellers-section__title">
          Tasdiqlangan sotuvchilar
        </Title>
        <Text type="secondary">Admin tomonidan tasdiqlangan va faol sotuvchilar</Text>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={sellers}
        loading={loading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{ emptyText: <Empty description="Hozircha tasdiqlangan sotuvchi yo'q" /> }}
        scroll={{ x: 900 }}
      />
    </section>
  );
}
