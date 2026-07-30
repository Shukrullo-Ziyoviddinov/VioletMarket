import React, { useState } from 'react';
import { Empty, Table, Typography } from 'antd';
import { deleteLogistica } from '../../api/logisticaAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import { useMiniGlobalModal } from '../../context/MiniGlobalModalContext';
import LogisticaChatModal from '../LogisticaChatModal/LogisticaChatModal';
import LogisticaActionsMenu from './LogisticaActionsMenu';
import LogisticaDetailModal from './LogisticaDetailModal';
import './LogisticaInfo.css';

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ');
}

export default function LogisticaApproved({ profiles, loading, onChanged }) {
  const { openMiniGlobalModal } = useMiniGlobalModal();
  const { showToast } = useAdminToast();
  const [openMenuId, setOpenMenuId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [chatLogistica, setChatLogistica] = useState(null);
  const [detailLogisticaId, setDetailLogisticaId] = useState('');

  const handleDelete = (profile) => {
    const name = profile.companyName || profile.name || profile.email || 'Logistica';

    openMiniGlobalModal({
      permissionKey: 'deleteLogistica',
      itemName: name,
      onConfirm: async () => {
        setDeletingId(profile.id);
        try {
          await deleteLogistica(profile.id);
          showToast({ type: 'success', message: 'Logistica akkaunti o‘chirildi' });
          setOpenMenuId('');
          onChanged?.();
        } catch (err) {
          showToast({
            type: 'error',
            message: err.message || 'Logisticani o‘chirib bo‘lmadi',
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
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        const isOpen = openMenuId === record.id;
        return (
          <LogisticaActionsMenu
            isOpen={isOpen}
            deleting={deletingId === record.id}
            onToggle={() => setOpenMenuId(isOpen ? '' : record.id)}
            onClose={() => setOpenMenuId('')}
            onInfo={() => setDetailLogisticaId(record.id)}
            onChat={() =>
              setChatLogistica({
                ...record,
                logisticaId: record.id,
              })
            }
            onDelete={() => handleDelete(record)}
          />
        );
      },
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
        scroll={{ x: 960 }}
        locale={{
          emptyText: (
            <Empty description="Hozircha tasdiqlangan logistica yo‘q" />
          ),
        }}
      />

      <LogisticaChatModal
        open={Boolean(chatLogistica)}
        logistica={chatLogistica}
        onClose={() => setChatLogistica(null)}
      />

      <LogisticaDetailModal
        open={Boolean(detailLogisticaId)}
        logisticaId={detailLogisticaId}
        onClose={() => setDetailLogisticaId('')}
      />
    </section>
  );
}
