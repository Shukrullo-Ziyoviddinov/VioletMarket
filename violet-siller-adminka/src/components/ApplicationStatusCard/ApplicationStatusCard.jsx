import React from 'react';
import { Button, Descriptions, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import './ApplicationStatusCard.css';

const { Title, Text, Paragraph } = Typography;

const STATUS_META = {
  draft: { color: 'default', label: 'Tasdiqlanmagan' },
  pending: { color: 'processing', label: 'Kutilmoqda' },
  approved: { color: 'success', label: 'Tasdiqlandi' },
  rejected: { color: 'error', label: 'Rad etildi' },
};

export default function ApplicationStatusCard({ application, onRefresh, loading }) {
  if (!application) {
    return (
      <div className="application-status-card">
        <Title level={4}>Ariza topilmadi</Title>
        <Paragraph type="secondary">
          Avval ro&apos;yxatdan o&apos;ting yoki emailni kiriting.
        </Paragraph>
        <Link to="/register">Ro&apos;yxatdan o&apos;tish</Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[application.status] || STATUS_META.draft;

  return (
    <div className="application-status-card">
      <div className="application-status-card__head">
        <Title level={4} className="application-status-card__title">
          Ariza holati
        </Title>
        <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
      </div>

      <Descriptions column={1} size="small" bordered className="application-status-card__descriptions">
        <Descriptions.Item label="Ism">{application.firstName}</Descriptions.Item>
        <Descriptions.Item label="Familiya">{application.lastName}</Descriptions.Item>
        <Descriptions.Item label="Gmail">{application.email}</Descriptions.Item>
        {application.shopDisplayName ? (
          <Descriptions.Item label="Do'kon nomi">{application.shopDisplayName}</Descriptions.Item>
        ) : null}
        {application.shopId ? (
          <Descriptions.Item label="Do'kon ID">{application.shopId}</Descriptions.Item>
        ) : null}
        {application.submittedAt ? (
          <Descriptions.Item label="Yuborilgan sana">
            {new Date(application.submittedAt).toLocaleString('uz-UZ')}
          </Descriptions.Item>
        ) : null}
      </Descriptions>

      {application.status === 'rejected' && application.rejectionReason ? (
        <Text type="danger" className="application-status-card__reason">
          Sabab: {application.rejectionReason}
        </Text>
      ) : null}

      {application.status === 'pending' ? (
        <Paragraph type="secondary" className="application-status-card__message">
          Arizangiz asosiy admin tomonidan ko&apos;rib chiqilmoqda. Tasdiqlangach bu yerda
          &quot;Tasdiqlandi&quot; holati chiqadi.
        </Paragraph>
      ) : null}

      <div className="application-status-card__actions">
        {application.status === 'approved' ? (
          <Link to="/login">
            <Button type="primary" size="large" block>
              Kirish
            </Button>
          </Link>
        ) : null}

        {application.status === 'rejected' ? (
          <Link to="/register">
            <Button type="primary" size="large" block>
              Qayta ariza berish
            </Button>
          </Link>
        ) : null}

        {application.status === 'pending' ? (
          <Button size="large" block onClick={onRefresh} loading={loading}>
            Yangilash
          </Button>
        ) : null}
      </div>
    </div>
  );
}
