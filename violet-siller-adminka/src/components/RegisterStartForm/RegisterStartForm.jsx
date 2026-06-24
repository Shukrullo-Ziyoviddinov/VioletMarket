import React, { useState } from 'react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { startSellerRegistration } from '../../api/sellerAuthApi';
import './RegisterStartForm.css';

const { Title, Text } = Typography;

export default function RegisterStartForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    try {
      await startSellerRegistration(values);
      navigate('/register/verify', { state: { email: values.email.trim() } });
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-start-form">
      <Title level={4} className="register-start-form__title">
        1-bosqich: Ro&apos;yxatdan o&apos;tish
      </Title>
      <Text type="secondary" className="register-start-form__subtitle">
        Ism, familiya va emailingizni kiriting. Tasdiqlash kodi yuboriladi.
      </Text>

      {error ? <Alert type="error" message={error} showIcon className="register-start-form__alert" /> : null}

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label="Ism"
          name="firstName"
          rules={[{ required: true, message: 'Ismni kiriting' }, { min: 2, message: 'Kamida 2 ta belgi' }]}
        >
          <Input placeholder="Ismingiz" size="large" />
        </Form.Item>

        <Form.Item
          label="Familiya"
          name="lastName"
          rules={[{ required: true, message: 'Familiyani kiriting' }, { min: 2, message: 'Kamida 2 ta belgi' }]}
        >
          <Input placeholder="Familiyangiz" size="large" />
        </Form.Item>

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

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Tasdiqlash kodini yuborish
        </Button>
      </Form>

      <div className="register-start-form__footer">
        <Link to="/login">Kirish</Link>
        <span>·</span>
        <Link to="/application/status">Ariza holati</Link>
      </div>
    </div>
  );
}
