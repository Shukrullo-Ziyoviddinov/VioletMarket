import React from 'react';
import { Button } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import './AddProductSaveBar.css';

export default function AddProductSaveBar({
  saving = false,
  isEditMode = false,
  onSave,
  disabled = false,
}) {
  return (
    <div className="add-product-save-bar" role="region" aria-label="Mahsulotni saqlash">
      <div className="add-product-save-bar__inner">
        <p className="add-product-save-bar__hint">
          {isEditMode
            ? 'O\'zgarishlarni saqlang — mijozlar saytida yangilanadi.'
            : 'Ma\'lumotlarni tekshirib, mahsulotni saqlang — u mijozlar saytida ko\'rinadi.'}
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
          Mahsulotni saqlash
        </Button>
      </div>
    </div>
  );
}
