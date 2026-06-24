import React, { useEffect, useState } from 'react';
import { Descriptions, Spin, Typography } from 'antd';
import { fetchSellerCabinetProfile } from '../../api/sellerAuthApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import './HomePage.css';

const { Title, Text } = Typography;

export default function HomePage() {
  const { token } = useSellerAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await fetchSellerCabinetProfile(token);
        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Profil yuklanmadi');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <section className="home-page home-page--loading">
        <Spin size="large" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="home-page">
        <Text type="danger">{error}</Text>
      </section>
    );
  }

  const account = profile?.account;
  const registration = profile?.registration;

  return (
    <section className="home-page">
      <Title level={3} className="home-page__title">
        Bosh sahifa
      </Title>

      <Descriptions bordered column={1} size="middle" className="home-page__descriptions">
        <Descriptions.Item label="Do'kon ID">{account?.id || '—'}</Descriptions.Item>
        <Descriptions.Item label="Do'kon nomi">{account?.name?.uz || registration?.shopDisplayName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Ism">{registration?.firstName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Familiya">{registration?.lastName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Gmail">{registration?.email || '—'}</Descriptions.Item>
        <Descriptions.Item label="Obunachilar">{account?.subscriberCount ?? 0}</Descriptions.Item>
        <Descriptions.Item label="Tavsif">{account?.description?.uz || '—'}</Descriptions.Item>
      </Descriptions>
    </section>
  );
}
