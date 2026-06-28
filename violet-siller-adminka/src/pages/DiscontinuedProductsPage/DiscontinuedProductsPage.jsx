import React from 'react';
import { Typography } from 'antd';
import SellerProductsGrid, {
  SellerProductsDeleteModal,
} from '../../components/SellerProductsGrid/SellerProductsGrid';
import { useSellerProductList } from '../../hooks/useSellerProductList';
import '../MyProductsPage/MyProductsPage.css';
import './DiscontinuedProductsPage.css';

const { Title, Text } = Typography;

export default function DiscontinuedProductsPage() {
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
            Vaqtincha to&apos;xtatilgan
          </Title>
          <Text type="secondary" className="my-products-page__subtitle">
            Mijozlar saytida vaqtincha ko&apos;rinmaydigan mahsulotlar.
          </Text>
        </div>
      </div>

      <SellerProductsGrid
        products={displayedProducts}
        loading={loading}
        error={error}
        emptyText="Vaqtincha to'xtatilgan mahsulot yo'q."
        emptyActionLabel="Barcha mahsulotlarga qaytish"
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
