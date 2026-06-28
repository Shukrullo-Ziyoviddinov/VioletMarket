import React from 'react';
import { Alert, Button, Spin, Typography } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import MiniGlobalModal from '../MiniGlobalModal/MiniGlobalModal';
import SellerProductCard from '../SellerProductCard/SellerProductCard';
import './SellerProductsGrid.css';

const { Text } = Typography;

export default function SellerProductsGrid({
  products,
  loading,
  error,
  emptyText,
  emptyActionLabel,
  onEmptyAction,
  openMenuProductId,
  setOpenMenuProductId,
  togglingPauseProductId,
  onEdit,
  onDelete,
  onTogglePause,
}) {
  if (loading) {
    return (
      <div className="seller-products-grid__loading">
        <Spin size="large" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="seller-products-grid__empty">
        <Text type="secondary">{emptyText}</Text>
        {onEmptyAction && emptyActionLabel ? (
          <Button type="link" onClick={onEmptyAction}>
            {emptyActionLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {error ? <Alert type="error" message={error} showIcon className="seller-products-grid__alert" /> : null}

      <div className="seller-products-grid">
        {products.map((product) => (
          <SellerProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePause={onTogglePause}
            togglingPause={togglingPauseProductId === product.id}
            isMenuOpen={openMenuProductId === product.id}
            onMenuToggle={() => {
              setOpenMenuProductId((current) => (current === product.id ? null : product.id));
            }}
            onMenuClose={() => setOpenMenuProductId(null)}
          />
        ))}
      </div>
    </>
  );
}

export function SellerProductsDeleteModal({
  open,
  deleting,
  onConfirm,
  onClose,
}) {
  return (
    <MiniGlobalModal
      open={open}
      permissionKey="deleteProduct"
      loading={deleting}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
