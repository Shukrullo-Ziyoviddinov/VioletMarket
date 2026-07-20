import React, { useMemo, useState } from 'react';
import { Avatar, Empty, Input, Table, Typography } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { deleteCourier } from '../../api/couriersAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import { useAdminModal } from '../../context/AdminModalContext';
import { useMiniGlobalModal } from '../../context/MiniGlobalModalContext';
import { resolveCourierImage } from '../../utils/courierImage';
import CourierActionsMenu from '../CourierActionsMenu/CourierActionsMenu';
import CourierChatModal from '../CourierChatModal/CourierChatModal';
import './CouriersListSection.css';

const { Title, Text } = Typography;

const TRANSPORT_LABELS = {
  car: 'Mashina',
  scooter: 'Skuterda',
  bicycle: 'Velosipedda',
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ');
}

function filterCouriers(couriers, query) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return couriers;

  return couriers.filter((courier) => {
    const haystack = [
      courier.firstName,
      courier.lastName,
      courier.email,
      courier.phone,
      TRANSPORT_LABELS[courier.transport] || '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export default function CouriersListSection({ couriers, loading, onChanged }) {
  const { openMiniGlobalModal } = useMiniGlobalModal();
  const { showToast } = useAdminToast();
  const { openAdminModal } = useAdminModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [openMenuId, setOpenMenuId] = useState('');
  const [chatCourier, setChatCourier] = useState(null);

  const filteredCouriers = useMemo(
    () => filterCouriers(couriers, searchQuery),
    [couriers, searchQuery],
  );

  const handleDelete = (courier) => {
    const fullName =
      `${courier.firstName || ''} ${courier.lastName || ''}`.trim() || courier.email;

    openMiniGlobalModal({
      permissionKey: 'deleteCourier',
      itemName: fullName,
      onConfirm: async () => {
        setDeletingId(courier.id);
        try {
          await deleteCourier(courier.id);
          showToast({ type: 'success', message: 'Kuryer akkaunti o‘chirildi' });
          onChanged?.();
        } catch (err) {
          showToast({
            type: 'error',
            message: err.message || 'Kuryerni o‘chirib bo‘lmadi',
          });
          throw err;
        } finally {
          setDeletingId('');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Rasm',
      dataIndex: 'profileImage',
      key: 'profileImage',
      width: 80,
      render: (value) => (
        <Avatar
          size={42}
          src={resolveCourierImage(value) || undefined}
          icon={<UserOutlined />}
        />
      ),
    },
    {
      title: 'Ism familiya',
      key: 'fullName',
      width: 180,
      render: (_, record) =>
        `${record.firstName || ''} ${record.lastName || ''}`.trim() || '—',
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Gmail',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: 'Transport',
      dataIndex: 'transport',
      key: 'transport',
      width: 130,
      render: (value) => TRANSPORT_LABELS[value] || 'Hali kiritilmagan',
    },
    {
      title: 'Ro‘yxatdan o‘tgan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value) => formatDate(value),
    },
    {
      title: '',
      key: 'actions',
      width: 70,
      fixed: 'right',
      render: (_, record) => (
        <CourierActionsMenu
          isOpen={openMenuId === record.id}
          deleting={deletingId === record.id}
          onToggle={() =>
            setOpenMenuId((prev) => (prev === record.id ? '' : record.id))
          }
          onClose={() => setOpenMenuId('')}
          onChat={() => setChatCourier(record)}
          onOrders={() => {
            const fullName =
              `${record.firstName || ''} ${record.lastName || ''}`.trim() ||
              record.email ||
              'Kuryer';
            openAdminModal({
              key: 'courier-accepted-orders',
              label: `${fullName} — Buyurtmalar`,
              courierId: record.id,
            });
          }}
          onDelete={() => handleDelete(record)}
        />
      ),
    },
  ];

  const emptyDescription = searchQuery.trim()
    ? 'Qidiruv bo‘yicha kuryer topilmadi'
    : 'Hozircha tasdiqlangan kuryer yo‘q';

  return (
    <section className="couriers-list-section">
      <div className="couriers-list-section__head">
        <div className="couriers-list-section__head-text">
          <Title level={4} className="couriers-list-section__title">
            Kuryerlar ma’lumoti
          </Title>
          <Text type="secondary">Tasdiqlangan yetkazib beruvchilar ro‘yxati</Text>
        </div>

        <Input
          allowClear
          className="couriers-list-section__search"
          placeholder="Ism, familiya, Gmail yoki telefon"
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <Table
        className="couriers-admin-table"
        rowKey="id"
        size="small"
        tableLayout="fixed"
        columns={columns}
        dataSource={filteredCouriers}
        loading={loading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{ emptyText: <Empty description={emptyDescription} /> }}
        scroll={filteredCouriers.length ? { x: 1010 } : undefined}
      />

      <CourierChatModal
        open={Boolean(chatCourier)}
        courier={chatCourier}
        onClose={() => setChatCourier(null)}
      />
    </section>
  );
}
