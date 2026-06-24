import React, { useMemo, useState } from 'react';
import { Button, Empty, Input, Table, Tag, Typography } from 'antd';
import { MoreOutlined, SearchOutlined } from '@ant-design/icons';
import { filterApprovedSellersBySearch } from './approvedSellersSearch';
import './ApprovedSellersSection.css';

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uz-UZ');
}

export default function ApprovedSellersSection({ sellers, loading }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSellers = useMemo(
    () => filterApprovedSellersBySearch(sellers, searchQuery),
    [sellers, searchQuery],
  );

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
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 56,
      align: 'center',
      render: () => (
        <Button
          type="text"
          className="approved-sellers-section__menu-btn"
          icon={<MoreOutlined />}
          aria-label="Sotuvchi amallari"
        />
      ),
    },
  ];

  const emptyDescription = searchQuery.trim()
    ? 'Qidiruv bo\'yicha sotuvchi topilmadi'
    : "Hozircha tasdiqlangan sotuvchi yo'q";

  return (
    <section className="approved-sellers-section">
      <div className="approved-sellers-section__head">
        <div className="approved-sellers-section__head-text">
          <Title level={4} className="approved-sellers-section__title">
            Tasdiqlangan sotuvchilar
          </Title>
          <Text type="secondary">Admin tomonidan tasdiqlangan va faol sotuvchilar</Text>
        </div>

        <Input
          allowClear
          className="approved-sellers-section__search"
          placeholder="Do'kon nomi, ism yoki familiya"
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredSellers}
        loading={loading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{ emptyText: <Empty description={emptyDescription} /> }}
        scroll={{ x: 900 }}
      />
    </section>
  );
}
