import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { allProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import './ProductPage.css';
import './UzWarehousePage.css';

const productInUzbWarehouse = (product) => {
  const countries = product?.countries;
  if (!Array.isArray(countries)) return false;
  return countries.some((c) => String(c || '').toLowerCase().trim() === 'uzb');
};

const UzWarehousePage = () => {
  const { t } = useTranslation();
  const products = useMemo(() => allProducts.filter(productInUzbWarehouse), []);

  return (
    <div className="product-page uz-warehouse-page">
      <div className="container">
        <h1 className="uz-warehouse-page__title">{t('uzWarehouse.pageTitle')}</h1>
        {products.length === 0 ? (
          <p className="product-page__empty">{t('uzWarehouse.empty')}</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UzWarehousePage;
