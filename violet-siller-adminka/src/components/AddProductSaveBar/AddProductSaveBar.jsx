import React from 'react';
import { Button } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './AddProductSaveBar.css';

export default function AddProductSaveBar({
  saving = false,
  isEditMode = false,
  onSave,
  disabled = false,
}) {
  const { t } = useTranslation();

  return (
    <div className="add-product-save-bar" role="region" aria-label={t('addProduct.saveBar.ariaLabel')}>
      <div className="add-product-save-bar__inner">
        <p className="add-product-save-bar__hint">
          {isEditMode ? t('addProduct.saveBar.hintEdit') : t('addProduct.saveBar.hintCreate')}
        </p>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          loading={saving}
          disabled={disabled || saving}
          onClick={onSave}
          className="add-product-save-bar__button"
        >
          {t('addProduct.saveBar.saveButton')}
        </Button>
      </div>
    </div>
  );
}
