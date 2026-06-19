import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Input, InputNumber, Radio, Spin } from 'antd';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import {
  assignFlashCategoryProduct,
  fetchFlashCategoryOptions,
  fetchFlashCategoryProducts,
  fetchFlashCategorySellerProducts,
  fetchFlashCategorySellers,
  removeFlashCategoryProduct,
} from '../../api/flashCategoryAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import { getLocalizedText, resolveProductImageUrl } from '../../utils/productDisplay';
import './FlashCategoryManager.css';

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase();
}

function FlashSellerSearch({ sellers, selectedSeller, onSelect, onClear }) {
  const rootRef = useRef(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredSellers = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return sellers;
    return sellers.filter((seller) => {
      const nameUz = getLocalizedText(seller?.name, 'uz').toLowerCase();
      const nameRu = getLocalizedText(seller?.name, 'ru').toLowerCase();
      const id = String(seller?.id || '').toLowerCase();
      return nameUz.includes(q) || nameRu.includes(q) || id.includes(q);
    });
  }, [query, sellers]);

  useEffect(() => {
    if (!selectedSeller) {
      setQuery('');
      return;
    }
    setQuery(getLocalizedText(selectedSeller.name, 'uz'));
  }, [selectedSeller]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div className="flash-category-manager__search" ref={rootRef}>
      <label className="flash-category-manager__search-label">Sotuvchi qidirish</label>
      <Input
        className="flash-category-manager__search-input"
        prefix={<SearchOutlined />}
        placeholder="Sotuvchi nomi"
        value={query}
        allowClear={!selectedSeller}
        onChange={(event) => {
          setQuery(event.target.value);
          if (selectedSeller) onClear();
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onPressEnter={() => {
          if (filteredSellers[0]) onSelect(filteredSellers[0]);
        }}
      />

      {isOpen ? (
        <div className="flash-category-manager__dropdown">
          {filteredSellers.length === 0 ? (
            <p className="flash-category-manager__dropdown-empty">Sotuvchi topilmadi</p>
          ) : (
            filteredSellers.map((seller) => {
              const name = getLocalizedText(seller.name, 'uz');
              const isActive = String(seller.id) === String(selectedSeller?.id);

              return (
                <button
                  key={seller.id}
                  type="button"
                  className={`flash-category-manager__dropdown-option${isActive ? ' flash-category-manager__dropdown-option--active' : ''}`}
                  onClick={() => {
                    onSelect(seller);
                    setIsOpen(false);
                  }}
                >
                  <img
                    className="flash-category-manager__dropdown-logo"
                    src={seller.logoUrl || resolveProductImageUrl(seller.logo)}
                    alt={name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = resolveProductImageUrl('');
                    }}
                  />
                  <span>{name}</span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function FlashProductSearch({
  products,
  selectedProduct,
  disabled,
  onSelect,
  onClear,
}) {
  const rootRef = useRef(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return products;
    return products.filter((product) => {
      const titleUz = getLocalizedText(product?.title, 'uz').toLowerCase();
      const titleRu = getLocalizedText(product?.title, 'ru').toLowerCase();
      const id = String(product?.id || '').toLowerCase();
      return titleUz.includes(q) || titleRu.includes(q) || id.includes(q);
    });
  }, [products, query]);

  useEffect(() => {
    if (!selectedProduct) {
      setQuery('');
      return;
    }
    setQuery(getLocalizedText(selectedProduct.title, 'uz'));
  }, [selectedProduct]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div className="flash-category-manager__search" ref={rootRef}>
      <label className="flash-category-manager__search-label">Mahsulot qidirish</label>
      <Input
        className="flash-category-manager__search-input"
        prefix={<SearchOutlined />}
        placeholder={disabled ? 'Avval sotuvchini tanlang' : 'Mahsulot nomi'}
        value={query}
        disabled={disabled}
        allowClear={!selectedProduct}
        onChange={(event) => {
          setQuery(event.target.value);
          if (selectedProduct) onClear();
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onPressEnter={() => {
          if (filteredProducts[0]) onSelect(filteredProducts[0]);
        }}
      />

      {isOpen && !disabled ? (
        <div className="flash-category-manager__dropdown flash-category-manager__dropdown--products">
          {filteredProducts.length === 0 ? (
            <p className="flash-category-manager__dropdown-empty">Mahsulot topilmadi</p>
          ) : (
            filteredProducts.map((product) => {
              const title = getLocalizedText(product.title, 'uz');
              const isActive = String(product.id) === String(selectedProduct?.id);

              return (
                <button
                  key={product.id}
                  type="button"
                  className={`flash-category-manager__product-option${isActive ? ' flash-category-manager__product-option--active' : ''}`}
                  onClick={() => {
                    onSelect(product);
                    setIsOpen(false);
                  }}
                >
                  <img
                    className="flash-category-manager__product-option-image"
                    src={product.imageUrl || resolveProductImageUrl(product.image)}
                    alt={title}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = resolveProductImageUrl('');
                    }}
                  />
                  <span className="flash-category-manager__product-option-info">
                    <strong>{title}</strong>
                    <span>{product.price}</span>
                    {product.originalPrice ? <span>{product.originalPrice}</span> : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function SelectionCard({ title, imageUrl, lines, emptyText }) {
  return (
    <div className="flash-category-manager__selection-card">
      <h3 className="flash-category-manager__selection-card-title">{title}</h3>
      {!lines ? (
        <p className="flash-category-manager__selection-empty">{emptyText}</p>
      ) : (
        <div className="flash-category-manager__selection-body">
          {imageUrl ? (
            <img
              className="flash-category-manager__selection-image"
              src={imageUrl}
              alt={title}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = resolveProductImageUrl('');
              }}
            />
          ) : null}
          <div className="flash-category-manager__selection-info">
            {lines.map((line) => (
              <span key={line.key}>{line.value}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlashCategoryManager() {
  const { showSuccess, showError } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [flashProducts, setFlashProducts] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellerProductsLoading, setSellerProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('products');
  const [flashDurationHours, setFlashDurationHours] = useState(3);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [options, sellerRows, assignedProducts] = await Promise.all([
        fetchFlashCategoryOptions(),
        fetchFlashCategorySellers(),
        fetchFlashCategoryProducts(),
      ]);

      setCategoryOptions(options);
      setSellers(sellerRows);
      setFlashProducts(assignedProducts);
      if (options[0]?.value) {
        setCategoryName((prev) => prev || options[0].value);
      }
    } catch (err) {
      setCategoryOptions([]);
      setSellers([]);
      setFlashProducts([]);
      setError(err.message || 'Maʼlumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (!selectedSeller?.id) {
      setSellerProducts([]);
      setSelectedProduct(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setSellerProductsLoading(true);
      try {
        const rows = await fetchFlashCategorySellerProducts(selectedSeller.id);
        if (!cancelled) {
          setSellerProducts(rows);
          setSelectedProduct(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSellerProducts([]);
          showError(err.message || 'Mahsulotlarni yuklashda xatolik');
        }
      } finally {
        if (!cancelled) setSellerProductsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSeller, showError]);

  const handleAssign = async () => {
    if (!selectedProduct?.id) {
      showError('Mahsulot tanlang');
      return;
    }

    setSaving(true);
    try {
      await assignFlashCategoryProduct({
        productId: selectedProduct.id,
        categoryName,
        flashDurationHours,
        flashCategoryName: 'true',
      });
      showSuccess('Mahsulot katta chegirma bo‘limiga biriktirildi');
      setSelectedSeller(null);
      setSelectedProduct(null);
      await loadPageData();
    } catch (err) {
      showError(err.message || 'Biriktirishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (productId) => {
    setSaving(true);
    try {
      await removeFlashCategoryProduct(productId);
      showSuccess('Mahsulot katta chegirma bo‘limidan olib tashlandi');
      await loadPageData();
    } catch (err) {
      showError(err.message || 'Olib tashlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flash-category-manager__state">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <section className="flash-category-manager">
      {error ? <div className="flash-category-manager__error">{error}</div> : null}

      <div className="flash-category-manager__search-row">
        <FlashSellerSearch
          sellers={sellers}
          selectedSeller={selectedSeller}
          onSelect={setSelectedSeller}
          onClear={() => {
            setSelectedSeller(null);
            setSelectedProduct(null);
          }}
        />
        <FlashProductSearch
          products={sellerProducts}
          selectedProduct={selectedProduct}
          disabled={!selectedSeller?.id || sellerProductsLoading}
          onSelect={setSelectedProduct}
          onClear={() => setSelectedProduct(null)}
        />
      </div>

      {sellerProductsLoading ? (
        <div className="flash-category-manager__inline-state">
          <Spin size="small" />
          <span>Mahsulotlar yuklanmoqda...</span>
        </div>
      ) : null}

      <div className="flash-category-manager__selection-row">
        <SelectionCard
          title="Tanlangan sotuvchi"
          emptyText="Sotuvchi tanlanmagan"
          imageUrl={selectedSeller?.logoUrl || resolveProductImageUrl(selectedSeller?.logo)}
          lines={
            selectedSeller
              ? [{ key: 'name', value: getLocalizedText(selectedSeller.name, 'uz') }]
              : null
          }
        />
        <SelectionCard
          title="Tanlangan mahsulot"
          emptyText="Mahsulot tanlanmagan"
          imageUrl={selectedProduct?.imageUrl || resolveProductImageUrl(selectedProduct?.image)}
          lines={
            selectedProduct
              ? [
                { key: 'title', value: getLocalizedText(selectedProduct.title, 'uz') },
                { key: 'price', value: selectedProduct.price || '—' },
                { key: 'originalPrice', value: selectedProduct.originalPrice || '—' },
              ]
              : null
          }
        />
      </div>

      <div className="flash-category-manager__assign-card">
        <h3 className="flash-category-manager__assign-title">Biriktirish sozlamalari</h3>
        <div className="flash-category-manager__assign-fields">
          <div className="flash-category-manager__category-field">
            <span className="flash-category-manager__field-label">categoryName</span>
            <Radio.Group
              className="flash-category-manager__category-radio"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
            >
              {categoryOptions.map((option) => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                </Radio>
              ))}
            </Radio.Group>
          </div>

          <div className="flash-category-manager__duration-field">
            <span className="flash-category-manager__field-label">flashDurationHours</span>
            <InputNumber
              min={1}
              max={72}
              value={flashDurationHours}
              onChange={(value) => setFlashDurationHours(Number(value) || 1)}
            />
          </div>
        </div>

        <Button type="primary" loading={saving} onClick={handleAssign}>
          Katta chegirmaga biriktirish
        </Button>
      </div>

      <div className="flash-category-manager__assigned">
        <h3 className="flash-category-manager__assigned-title">
          Katta chegirma mahsulotlari ({flashProducts.length})
        </h3>

        {flashProducts.length === 0 ? (
          <Empty description="Hozircha biriktirilgan mahsulot yo‘q" />
        ) : (
          <div className="flash-category-manager__assigned-list">
            {flashProducts.map((product) => (
              <article key={product.id} className="flash-category-manager__assigned-item">
                <img
                  className="flash-category-manager__assigned-image"
                  src={product.imageUrl || resolveProductImageUrl(product.image)}
                  alt={getLocalizedText(product.title, 'uz')}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = resolveProductImageUrl('');
                  }}
                />
                <div className="flash-category-manager__assigned-info">
                  <strong>{getLocalizedText(product.title, 'uz')}</strong>
                  <span>{getLocalizedText(product.seller?.name, 'uz') || '—'}</span>
                  <span>{product.price || '—'}</span>
                  <span>{product.originalPrice || '—'}</span>
                  <span>
                    {product.categoryName || '—'} · {product.flashDurationHours || '—'} soat
                  </span>
                </div>
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  loading={saving}
                  onClick={() => handleRemove(product.id)}
                >
                  Olib tashlash
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
