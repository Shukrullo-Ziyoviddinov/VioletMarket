import React from 'react';
import { Button, Typography } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SellerProductsGrid, {
  SellerProductsDeleteModal,
} from '../../components/SellerProductsGrid/SellerProductsGrid';
import { useSellerProductList } from '../../hooks/useSellerProductList';
import '../MyProductsPage/MyProductsPage.css';

const { Title, Text } = Typography;

export default function MyProductsPage() {
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
  } = useSellerProductList({ productFilter: 'all' });

  return (
    <section className="my-products-page">
      <div className="my-products-page__head">
        <div>
          <Title level={3} className="my-products-page__title">
            {t('myProducts.title')}
          </Title>
          <Text type="secondary" className="my-products-page__subtitle">
            {t('myProducts.subtitle')}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          onClick={() => navigate('/products/add')}
        >
          {t('myProducts.addProduct')}
        </Button>
      </div>

      <SellerProductsGrid
        products={displayedProducts}
        loading={loading}
        error={error}
        emptyText="Hozircha mahsulot yo'q."
        emptyActionLabel="Birinchi mahsulotni qo'shing"
        onEmptyAction={() => navigate('/products/add')}
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
