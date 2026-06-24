import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { verifySellerEmail } from '../../api/sellerAuthApi';
import { REGISTRATION_TOKEN_KEY } from '../../context/SellerAuthContext';
import './RegisterVerifyForm.css';

const { Title, Text } = Typography;

export default function RegisterVerifyForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = String(location.state?.email || '').trim();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
      return;
    }
    form.setFieldsValue({ email });
  }, [email, form, navigate]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    try {
      const result = await verifySellerEmail({
        email: values.email,
        code: values.code,
      });
      if (result?.registrationToken) {
        localStorage.setItem(REGISTRATION_TOKEN_KEY, result.registrationToken);
      }
      navigate('/application');
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="register-verify-form">
      <Title level={4} className="register-verify-form__title">
        Emailni tasdiqlash
      </Title>
      <Text type="secondary" className="register-verify-form__subtitle">
        <strong>{email}</strong> manziliga yuborilgan 6 xonali kodni kiriting.
      </Text>

      {error ? <Alert type="error" message={error} showIcon className="register-verify-form__alert" /> : null}

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item name="email" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          label="Tasdiqlash kodi"
          name="code"
          rules={[{ required: true, message: 'Kodni kiriting' }]}
        >
          <Input placeholder="123456" size="large" maxLength={6} inputMode="numeric" />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Tasdiqlash
        </Button>
      </Form>

      <div className="register-verify-form__footer">
        <Link to="/register">Orqaga</Link>
      </div>
    </div>
  );
}
