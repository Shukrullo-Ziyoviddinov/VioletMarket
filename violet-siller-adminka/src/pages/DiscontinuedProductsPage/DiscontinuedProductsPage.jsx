import React from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerProductsGrid, {
  SellerProductsDeleteModal,
} from '../../components/SellerProductsGrid/SellerProductsGrid';
import { useSellerProductList } from '../../hooks/useSellerProductList';
import '../MyProductsPage/MyProductsPage.css';
import './DiscontinuedProductsPage.css';

const { Title, Text } = Typography;

export default function DiscontinuedProductsPage() {
  const { t } = useTranslation();
  const {
    navigate,
    displayedProducts,
    loading,
    error,
    openMenuProductId,
    setOpenMenuProductId,
    deleteTargetId,
    deleting,
    togglingPauseProductId,
    handleDeleteRequest,
    handleCloseDeleteModal,
    handleConfirmDelete,
    handleTogglePause,
  } = useSellerProductList({ productFilter: 'paused' });

  return (
    <section className="my-products-page discontinued-products-page">
      <div className="my-products-page__head">
        <div>
          <Title level={3} className="my-products-page__title">
            {t('discontinuedProducts.title')}
          </Title>
          <Text type="secondary" className="my-products-page__subtitle">
            {t('discontinuedProducts.subtitle')}
          </Text>
        </div>
      </div>

      <SellerProductsGrid
        products={displayedProducts}
        loading={loading}
        error={error}
        emptyText={t('discontinuedProducts.emptyText')}
        emptyActionLabel={t('discontinuedProducts.emptyActionLabel')}
        onEmptyAction={() => navigate('/products')}
        openMenuProductId={openMenuProductId}
        setOpenMenuProductId={setOpenMenuProductId}
        togglingPauseProductId={togglingPauseProductId}
        onEdit={(productId) => navigate(`/products/${productId}/edit`)}
        onDelete={handleDeleteRequest}
        onTogglePause={handleTogglePause}
      />

      <SellerProductsDeleteModal
        open={deleteTargetId != null}
        deleting={deleting}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
      />
    </section>
  );
}
