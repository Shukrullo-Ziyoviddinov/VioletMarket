import React, { useMemo, useState } from 'react';
import { Empty, Input, message, Table, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { activateSeller, deleteSeller, pauseSeller } from '../../api/sellersAdminApi';
import ApprovedSellerActionsMenu from '../ApprovedSellerActionsMenu/ApprovedSellerActionsMenu';
import SellerStatusBadge from '../SellerStatusBadge/SellerStatusBadge';
import SellerTableExpandedRow from '../SellerTableExpandedRow/SellerTableExpandedRow';
import { useMiniGlobalModal } from '../../context/MiniGlobalModalContext';
import {
  formatSellerCountry,
  getSellerCountryCode,
  getSellerCountryTagColor,
} from '../../utils/sellerCountryDisplay';
import { filterApprovedSellersBySearch } from './approvedSellersSearch';
import '../SellersTable/SellersTable.css';
import './ApprovedSellersSection.css';

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uz-UZ');
}

function getSellerStatus(seller) {
  return seller?.sellerAccount?.status === 'paused' ? 'paused' : 'active';
}

export default function ApprovedSellersSection({ sellers, loading, onChanged }) {
  const { openMiniGlobalModal } = useMiniGlobalModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuShopId, setOpenMenuShopId] = useState(null);
  const [togglingShopId, setTogglingShopId] = useState(null);
  const [deletingShopId, setDeletingShopId] = useState(null);

  const filteredSellers = useMemo(
    () => filterApprovedSellersBySearch(sellers, searchQuery),
    [sellers, searchQuery],
  );

  const handleToggleStatus = async (seller) => {
    const shopId = seller.shopId;
    const currentStatus = getSellerStatus(seller);
    const nextAction = currentStatus === 'paused' ? activateSeller : pauseSeller;

    setTogglingShopId(shopId);

    try {
      await nextAction(shopId);
      message.success(
        currentStatus === 'paused'
          ? 'Sotuvchi faollashtirildi'
          : "Sotuvchi vaqtincha to'xtatildi",
      );
      onChanged?.();
    } catch (err) {
      message.error(err.message || 'Amalni bajarib bo\'lmadi');
    } finally {
      setTogglingShopId(null);
    }
  };

  const handleDeleteSeller = (seller) => {
    const shopId = seller.shopId;
    const sellerLabel = seller.shopDisplayName || shopId;

    openMiniGlobalModal({
      permissionKey: 'deleteSeller',
      itemName: sellerLabel,
      onConfirm: async () => {
        setDeletingShopId(shopId);

        try {
          await deleteSeller(shopId);
          message.success('Sotuvchi va bog\'liq ma\'lumotlar o\'chirildi');
          setOpenMenuShopId(null);
          onChanged?.();
        } catch (err) {
          message.error(err.message || 'Sotuvchini o\'chirib bo\'lmadi');
          throw err;
        } finally {
          setDeletingShopId(null);
        }
      },
    });
  };

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
      title: 'Sotuvchi davlati',
      key: 'sellerCountry',
      width: 120,
      render: (_, seller) => {
        const country = getSellerCountryCode(seller);
        if (!country) return '—';
        return <Tag color={getSellerCountryTagColor(country)}>{formatSellerCountry(country)}</Tag>;
      },
    },
    {
      title: 'Holat',
      key: 'status',
      width: 110,
      render: (_, seller) => <SellerStatusBadge status={getSellerStatus(seller)} />,
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
      render: (_, seller) => {
        const shopId = seller.shopId;
        const isOpen = openMenuShopId === shopId;

        return (
          <ApprovedSellerActionsMenu
            isOpen={isOpen}
            status={getSellerStatus(seller)}
            deleting={deletingShopId === shopId}
            togglingStatus={togglingShopId === shopId}
            onToggle={() => setOpenMenuShopId(isOpen ? null : shopId)}
            onClose={() => setOpenMenuShopId(null)}
            onDelete={() => handleDeleteSeller(seller)}
            onToggleStatus={() => handleToggleStatus(seller)}
          />
        );
      },
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
        className="sellers-admin-table"
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={filteredSellers}
        loading={loading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        expandable={{
          expandedRowRender: (record) => <SellerTableExpandedRow record={record} />,
        }}
        locale={{ emptyText: <Empty description={emptyDescription} /> }}
        scroll={{ x: 1100 }}
      />
    </section>
  );
}
