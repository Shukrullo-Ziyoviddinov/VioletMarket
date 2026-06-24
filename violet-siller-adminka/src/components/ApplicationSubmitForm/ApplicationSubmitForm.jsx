import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApplicationStatus, submitSellerApplication } from '../../api/sellerAuthApi';
import { REGISTRATION_TOKEN_KEY } from '../../context/SellerAuthContext';
import './ApplicationSubmitForm.css';

const { Title, Text } = Typography;

export default function ApplicationSubmitForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const registrationToken = localStorage.getItem(REGISTRATION_TOKEN_KEY);
    if (!registrationToken) {
      navigate('/register', { replace: true });
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await fetchApplicationStatus({ registrationToken });
        if (cancelled) return;

        if (data?.application?.status === 'pending') {
          navigate('/application/status', { replace: true });
          return;
        }

        if (data?.application?.status === 'approved') {
          navigate('/login', { replace: true });
          return;
        }

        setProfile(data?.application || null);
        form.setFieldsValue({
          firstName: data?.application?.firstName || '',
          lastName: data?.application?.lastName || '',
          email: data?.application?.email || '',
        });
      } catch {
        if (!cancelled) {
          navigate('/register', { replace: true });
        }
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [form, navigate]);

  const handleSubmit = async (values) => {
    const registrationToken = localStorage.getItem(REGISTRATION_TOKEN_KEY);
    if (!registrationToken) {
      navigate('/register', { replace: true });
      return;
    }

    setLoading(true);
    setError('');
    try {
      await submitSellerApplication(
        {
          shopDisplayName: values.shopDisplayName,
          shopId: values.shopId,
          password: values.password,
        },
        registrationToken,
      );
      navigate('/application/status');
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) {
    return <Text type="secondary">Yuklanmoqda...</Text>;
  }

  return (
    <div className="application-submit-form">
      <Title level={4} className="application-submit-form__title">
        2-bosqich: Ariza qoldirish
      </Title>
      <Text type="secondary" className="application-submit-form__subtitle">
        Do&apos;kon ma&apos;lumotlarini to&apos;ldiring va arizani yuboring.
      </Text>

      {error ? <Alert type="error" message={error} showIcon className="application-submit-form__alert" /> : null}

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="Ism" name="firstName">
          <Input size="large" disabled className="application-submit-form__locked" />
        </Form.Item>

        <Form.Item label="Familiya" name="lastName">
          <Input size="large" disabled className="application-submit-form__locked" />
        </Form.Item>

        <Form.Item label="Gmail" name="email">
          <Input size="large" disabled className="application-submit-form__locked" />
        </Form.Item>

        <Form.Item
          label="Do'kon nomi"
          name="shopDisplayName"
          rules={[{ required: true, message: "Do'kon nomini kiriting" }, { min: 2, message: 'Kamida 2 ta belgi' }]}
        >
          <Input placeholder="Masalan: Violet Market" size="large" />
        </Form.Item>

        <Form.Item
          label="Do'kon ID"
          name="shopId"
          extra="Faqat lotin harflari, raqamlar va tire. Keyin o'zgartirib bo'lmaydi."
          rules={[{ required: true, message: "Do'kon ID kiriting" }, { min: 2, message: 'Kamida 2 ta belgi' }]}
        >
          <Input placeholder="violet-market" size="large" />
        </Form.Item>

        <Form.Item
          label="Parol"
          name="password"
          rules={[{ required: true, message: 'Parolni kiriting' }, { min: 6, message: 'Kamida 6 ta belgi' }]}
        >
          <Input.Password placeholder="Parol" size="large" />
        </Form.Item>

        <Form.Item
          label="Parolni tasdiqlash"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Parolni qayta kiriting' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Parollar mos emas'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Parolni qayta kiriting" size="large" />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Yuborish
        </Button>
      </Form>

      {profile ? (
        <Text type="secondary" className="application-submit-form__hint">
          Ariza yuborilgach admin tasdiqlashini kutasiz.
        </Text>
      ) : null}

      <div className="application-submit-form__footer">
        <Link to="/application/status">Ariza holati</Link>
      </div>
    </div>
  );
}
