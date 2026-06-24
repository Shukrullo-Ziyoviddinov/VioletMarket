import React, { useState } from 'react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { loginSeller } from '../../api/sellerAuthApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import './SellerLoginForm.css';

const { Title, Text } = Typography;

export default function SellerLoginForm() {
  const navigate = useNavigate();
  const { login } = useSellerAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginSeller({
        shopId: values.shopId,
        password: values.password,
      });
      login(result.token, result.seller);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-login-form">
      <Title level={4} className="seller-login-form__title">
        Sotuvchi kirish
      </Title>
      <Text type="secondary" className="seller-login-form__subtitle">
        Tasdiqlangan do&apos;kon ID va parolingiz bilan kiring.
      </Text>

      {error ? <Alert type="error" message={error} showIcon className="seller-login-form__alert" /> : null}

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label="Do'kon ID"
          name="shopId"
          rules={[{ required: true, message: "Do'kon ID kiriting" }]}
        >
          <Input placeholder="violet-market" size="large" />
        </Form.Item>

        <Form.Item
          label="Parol"
          name="password"
          rules={[{ required: true, message: 'Parolni kiriting' }]}
        >
          <Input.Password placeholder="Parol" size="large" />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Kirish
        </Button>
      </Form>

      <div className="seller-login-form__footer">
        <Link to="/register">Ro&apos;yxatdan o&apos;tish</Link>
        <span>·</span>
        <Link to="/application/status">Ariza holati</Link>
      </div>
    </div>
  );
}
