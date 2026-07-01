import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Space, Spin, Typography, Upload, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PictureOutlined,
  SaveOutlined,
  ShopOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  fetchSellerCabinetProfile,
  updateSellerMarketProfile,
  uploadSellerMarketImage,
} from '../../api/sellerAuthApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import './MarketInfoForm.css';

const { Text } = Typography;
const { TextArea } = Input;

const DEFAULT_LOGO = 'img/vm logo.jpg';

function buildFormValues(profile) {
  const account = profile?.account || {};
  return {
    nameUz: account?.name?.uz || '',
    nameRu: account?.name?.ru || '',
    descriptionUz: account?.description?.uz || '',
    descriptionRu: account?.description?.ru || '',
    logo: account?.logo || DEFAULT_LOGO,
  };
}

export default function MarketInfoForm() {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const [form] = Form.useForm();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const logoValue = Form.useWatch('logo', form);
  const logoPreview = useMemo(() => resolveAssetUrl(logoValue), [logoValue]);

  const loadProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchSellerCabinetProfile(token);
      setProfile(data);
      form.setFieldsValue(buildFormValues(data));
    } catch (err) {
      setError(err.message || t('marketInfo.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const data = await updateSellerMarketProfile(token, {
        nameUz: values.nameUz,
        nameRu: values.nameRu,
        descriptionUz: values.descriptionUz,
        descriptionRu: values.descriptionRu,
        logo: values.logo,
      });
      setProfile(data);
      form.setFieldsValue(buildFormValues(data));
      setIsEditing(false);
      message.success(t('marketInfo.saveSuccess'));
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.message || t('marketInfo.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.setFieldsValue(buildFormValues(profile));
    setIsEditing(false);
  };

  const handleLogoUpload = async ({ file, onSuccess, onError }) => {
    try {
      setUploading(true);
      const result = await uploadSellerMarketImage(token, file);
      form.setFieldValue('logo', result?.path || '');
      onSuccess?.(result);
      message.success(t('marketInfo.logoUploadSuccess'));
    } catch (err) {
      onError?.(err);
      message.error(err.message || t('marketInfo.logoUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    form.setFieldValue('logo', DEFAULT_LOGO);
    message.info(t('marketInfo.logoResetInfo'));
  };

  const handleClearDescription = (fieldName) => {
    form.setFieldValue(fieldName, '');
  };

  if (loading) {
    return (
      <div className="market-info-form market-info-form--loading">
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-info-form">
        <Text type="danger">{error}</Text>
      </div>
    );
  }

  const account = profile?.account;
  const registration = profile?.registration;

  return (
    <div className="market-info-form">
      <div className="market-info-form__toolbar">
        {!isEditing ? (
          <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            {t('marketInfo.edit')}
          </Button>
        ) : (
          <Space wrap>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              {t('marketInfo.save')}
            </Button>
            <Button onClick={handleCancel}>{t('marketInfo.cancel')}</Button>
          </Space>
        )}
      </div>

      <Form form={form} layout="vertical" disabled={!isEditing} requiredMark={false}>
        <div className="market-info-form__readonly">
          <div className="market-info-form__row">
            <div className="market-info-form__icon-wrap">
              <ShopOutlined />
            </div>
            <div>
              <Text className="market-info-form__label">{t('marketInfo.shopId')}</Text>
              <Text className="market-info-form__value">{account?.id || '—'}</Text>
            </div>
          </div>
          <div className="market-info-form__row">
            <div className="market-info-form__icon-wrap">
              <GlobalOutlined />
            </div>
            <div>
              <Text className="market-info-form__label">{t('marketInfo.subscribers')}</Text>
              <Text className="market-info-form__value">{account?.subscriberCount ?? 0}</Text>
            </div>
          </div>
          <div className="market-info-form__row">
            <div className="market-info-form__icon-wrap">
              <GlobalOutlined />
            </div>
            <div>
              <Text className="market-info-form__label">{t('marketInfo.sellerCountry')}</Text>
              <Text className="market-info-form__value">
                {String(account?.sellerCountry || '').toUpperCase() || '—'}
              </Text>
            </div>
          </div>
        </div>

        <div className="market-info-form__field-card">
          <div className="market-info-form__field-head">
            <div className="market-info-form__icon-wrap market-info-form__icon-wrap--image">
              <PictureOutlined />
            </div>
            <Text className="market-info-form__field-title">{t('marketInfo.logo')}</Text>
          </div>
          <div className="market-info-form__logo-preview">
            <img src={logoPreview} alt={t('marketInfo.logoAlt')} className="market-info-form__logo-img" />
          </div>
          <Form.Item name="logo" hidden>
            <Input />
          </Form.Item>
          {isEditing ? (
            <Space wrap>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleLogoUpload}
                disabled={uploading}
              >
                <Button loading={uploading}>{t('marketInfo.uploadImage')}</Button>
              </Upload>
              <Button icon={<DeleteOutlined />} onClick={handleRemoveLogo}>
                {t('marketInfo.remove')}
              </Button>
            </Space>
          ) : null}
        </div>

        <div className="market-info-form__field-card">
          <div className="market-info-form__field-head">
            <div className="market-info-form__icon-wrap">
              <ShopOutlined />
            </div>
            <Text className="market-info-form__field-title">{t('marketInfo.shopNameUz')}</Text>
          </div>
          <Form.Item
            name="nameUz"
            rules={[{ required: true, message: t('marketInfo.validationShopName') }]}
          >
            <Input placeholder={t('marketInfo.placeholderShopName')} />
          </Form.Item>
        </div>

        <div className="market-info-form__field-card">
          <div className="market-info-form__field-head">
            <div className="market-info-form__icon-wrap">
              <TranslationOutlined />
            </div>
            <Text className="market-info-form__field-title">{t('marketInfo.shopNameRu')}</Text>
          </div>
          <Form.Item
            name="nameRu"
            rules={[{ required: true, message: t('marketInfo.validationShopName') }]}
          >
            <Input placeholder={t('marketInfo.placeholderShopName')} />
          </Form.Item>
        </div>

        <div className="market-info-form__field-card">
          <div className="market-info-form__field-head">
            <div className="market-info-form__icon-wrap">
              <PictureOutlined />
            </div>
            <Text className="market-info-form__field-title">{t('marketInfo.descriptionUz')}</Text>
          </div>
          <Form.Item name="descriptionUz">
            <TextArea rows={4} placeholder={t('marketInfo.placeholderDescriptionUz')} />
          </Form.Item>
          {isEditing ? (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleClearDescription('descriptionUz')}
            >
              {t('marketInfo.remove')}
            </Button>
          ) : null}
        </div>

        <div className="market-info-form__field-card">
          <div className="market-info-form__field-head">
            <div className="market-info-form__icon-wrap">
              <PictureOutlined />
            </div>
            <Text className="market-info-form__field-title">{t('marketInfo.descriptionRu')}</Text>
          </div>
          <Form.Item name="descriptionRu">
            <TextArea rows={4} placeholder={t('marketInfo.placeholderDescriptionRu')} />
          </Form.Item>
          {isEditing ? (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleClearDescription('descriptionRu')}
            >
              {t('marketInfo.remove')}
            </Button>
          ) : null}
        </div>
      </Form>

      <div className="market-info-form__readonly market-info-form__readonly--footer">
        <Text className="market-info-form__label">{t('marketInfo.owner')}</Text>
        <Text className="market-info-form__value">
          {registration?.firstName || '—'} {registration?.lastName || ''}
        </Text>
        <Text className="market-info-form__value market-info-form__value--muted">
          {registration?.email || '—'}
        </Text>
      </div>
    </div>
  );
}
