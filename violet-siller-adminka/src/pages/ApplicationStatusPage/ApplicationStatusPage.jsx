import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { fetchApplicationStatus } from '../../api/sellerAuthApi';
import ApplicationStatusCard from '../../components/ApplicationStatusCard/ApplicationStatusCard';
import { REGISTRATION_TOKEN_KEY } from '../../context/SellerAuthContext';
import './ApplicationStatusPage.css';

const { Text } = Typography;

export default function ApplicationStatusPage() {
  const [form] = Form.useForm();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [lookupEmail, setLookupEmail] = useState('');

  const loadStatus = useCallback(async ({ email, registrationToken } = {}) => {
    setLoading(true);
    try {
      const data = await fetchApplicationStatus({ email, registrationToken });
      setApplication(data?.application || null);
      if (data?.application?.email) {
        setLookupEmail(data.application.email);
        form.setFieldsValue({ email: data.application.email });
      }
    } catch {
      if (email) {
        setApplication(null);
      }
    } finally {
      setLoading(false);
      setBootLoading(false);
    }
  }, [form]);

  useEffect(() => {
    const registrationToken = localStorage.getItem(REGISTRATION_TOKEN_KEY);
    if (registrationToken) {
      loadStatus({ registrationToken });
      return;
    }
    setBootLoading(false);
  }, [loadStatus]);

  const handleLookup = async (values) => {
    const email = String(values.email || '').trim();
    setLookupEmail(email);
    await loadStatus({ email });
  };

  return (
    <div className="application-status-page">
      {!bootLoading && !application && !lookupEmail ? (
        <>
          <Text type="secondary" className="application-status-page__hint">
            Ariza holatini tekshirish uchun emailingizni kiriting.
          </Text>
          <Form form={form} layout="vertical" onFinish={handleLookup} requiredMark={false}>
            <Form.Item
              label="Gmail"
              name="email"
              rules={[
                { required: true, message: 'Emailni kiriting' },
                { type: 'email', message: 'Email formati noto\'g\'ri' },
              ]}
            >
              <Input placeholder="example@gmail.com" size="large" />
            </Form.Item>
            <Form.Item>
              <button type="submit" className="application-status-page__lookup-btn" disabled={loading}>
                {loading ? 'Qidirilmoqda...' : 'Qidirish'}
              </button>
            </Form.Item>
          </Form>
        </>
      ) : null}

      {!bootLoading ? (
        <ApplicationStatusCard
          application={application}
          onRefresh={() => {
            const registrationToken = localStorage.getItem(REGISTRATION_TOKEN_KEY);
            if (registrationToken) {
              loadStatus({ registrationToken });
              return;
            }
            if (lookupEmail) {
              loadStatus({ email: lookupEmail });
            }
          }}
          loading={loading}
        />
      ) : (
        <Text type="secondary">Yuklanmoqda...</Text>
      )}

      <div className="application-status-page__footer">
        <Link to="/login">Kirish</Link>
        <span>·</span>
        <Link to="/register">Ro&apos;yxatdan o&apos;tish</Link>
      </div>
    </div>
  );
}
