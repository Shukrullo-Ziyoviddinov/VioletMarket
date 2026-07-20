import React, { useCallback, useEffect, useState } from 'react';
import { Button, InputNumber, Space, Table, Typography } from 'antd';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  fetchCourierPaymentTariffs,
  updateCourierPaymentTariffs,
} from '../../api/courierPaymentAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import './CourierPaymentTariffsSection.css';

const { Title, Text } = Typography;

function emptyTier(index = 0) {
  return {
    key: `tier-${Date.now()}-${index}`,
    minKm: 0,
    maxKm: 0,
    amount: 0,
  };
}

export default function CourierPaymentTariffsSection() {
  const { showToast } = useAdminToast();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTariffs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCourierPaymentTariffs();
      const rows = Array.isArray(data?.tiers) ? data.tiers : [];
      setTiers(
        rows.map((tier, index) => ({
          key: `tier-${index}`,
          minKm: Number(tier.minKm) || 0,
          maxKm: Number(tier.maxKm) || 0,
          amount: Number(tier.amount) || 0,
        })),
      );
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || 'Tariflarni yuklab bo‘lmadi',
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTariffs();
  }, [loadTariffs]);

  const updateTier = (key, field, value) => {
    setTiers((prev) =>
      prev.map((tier) =>
        tier.key === key ? { ...tier, [field]: Math.max(0, Number(value) || 0) } : tier,
      ),
    );
  };

  const handleAddTier = () => {
    setTiers((prev) => [...prev, emptyTier(prev.length)]);
  };

  const handleRemoveTier = (key) => {
    setTiers((prev) => prev.filter((tier) => tier.key !== key));
  };

  const handleSave = async () => {
    if (!tiers.length) {
      showToast({ type: 'error', message: 'Kamida bitta tarif qo‘shing' });
      return;
    }

    setSaving(true);
    try {
      await updateCourierPaymentTariffs(
        tiers.map(({ minKm, maxKm, amount }) => ({ minKm, maxKm, amount })),
      );
      showToast({ type: 'success', message: 'Kuryer to‘lov tariflari saqlandi' });
      await loadTariffs();
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || 'Tariflarni saqlab bo‘lmadi',
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Dan (km)',
      dataIndex: 'minKm',
      key: 'minKm',
      width: 140,
      render: (value, record) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(next) => updateTier(record.key, 'minKm', next)}
        />
      ),
    },
    {
      title: 'Gacha (km)',
      dataIndex: 'maxKm',
      key: 'maxKm',
      width: 140,
      render: (value, record) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(next) => updateTier(record.key, 'maxKm', next)}
        />
      ),
    },
    {
      title: 'To‘lov (so‘m)',
      dataIndex: 'amount',
      key: 'amount',
      width: 180,
      render: (value, record) => (
        <InputNumber
          min={0}
          step={1000}
          value={value}
          formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
          parser={(val) => Number(String(val || '').replace(/\s/g, ''))}
          onChange={(next) => updateTier(record.key, 'amount', next)}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="link" danger onClick={() => handleRemoveTier(record.key)}>
          O‘chirish
        </Button>
      ),
    },
  ];

  return (
    <section className="courier-payment-tariffs-section">
      <div className="courier-payment-tariffs-section__head">
        <div>
          <Title level={4} className="courier-payment-tariffs-section__title">
            Kuryer to‘lov tariflari
          </Title>
          <Text type="secondary">
            Topshirilgan buyurtma masofasiga qarab kuryerga to‘lanadigan summa
          </Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} onClick={handleAddTier}>
            Tarif qo‘shish
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
          >
            Saqlash
          </Button>
        </Space>
      </div>

      <Table
        rowKey="key"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={tiers}
        pagination={false}
      />
    </section>
  );
}
