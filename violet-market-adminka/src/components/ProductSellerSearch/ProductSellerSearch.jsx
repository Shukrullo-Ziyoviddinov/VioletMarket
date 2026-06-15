import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { getLocalizedText, resolveProductImageUrl } from '../../utils/productDisplay';
import './ProductSellerSearch.css';

function normalizeSellerName(seller) {
  return getLocalizedText(seller?.name, 'uz').trim().toLowerCase();
}

export function collectSellersFromProducts(products) {
  const map = new Map();

  for (const product of Array.isArray(products) ? products : []) {
    const sellerId = String(product?.sellerId || '').trim();
    if (!sellerId || !product?.seller || map.has(sellerId)) continue;
    map.set(sellerId, {
      id: sellerId,
      name: product.seller.name,
      logo: product.seller.logo,
      logoUrl: product.seller.logoUrl || resolveProductImageUrl(product.seller.logo),
    });
  }

  return [...map.values()].sort((a, b) =>
    normalizeSellerName(a).localeCompare(normalizeSellerName(b), 'uz'),
  );
}

export default function ProductSellerSearch({
  sellers = [],
  selectedSellerId = null,
  onSellerSelect,
  onClear,
}) {
  const rootRef = useRef(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredSellers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter((seller) => {
      const nameUz = getLocalizedText(seller?.name, 'uz').toLowerCase();
      const nameRu = getLocalizedText(seller?.name, 'ru').toLowerCase();
      const id = String(seller?.id || '').toLowerCase();
      return nameUz.includes(q) || nameRu.includes(q) || id.includes(q);
    });
  }, [sellers, query]);

  useEffect(() => {
    if (!selectedSellerId) {
      setQuery('');
      return;
    }

    const selected = sellers.find((item) => String(item.id) === String(selectedSellerId));
    if (selected) {
      setQuery(getLocalizedText(selected.name, 'uz'));
    }
  }, [selectedSellerId, sellers]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleSelectSeller = (seller) => {
    if (!seller?.id) return;
    setQuery(getLocalizedText(seller.name, 'uz'));
    setIsOpen(false);
    if (typeof onSellerSelect === 'function') {
      onSellerSelect(String(seller.id));
    }
  };

  const handleSubmitSearch = () => {
    if (filteredSellers.length === 0) return;
    handleSelectSeller(filteredSellers[0]);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    if (typeof onClear === 'function') {
      onClear();
    }
  };

  return (
    <div className="product-seller-search" ref={rootRef}>
      <div className="product-seller-search__field-wrap">
        <Input
          className="product-seller-search__input"
          prefix={<SearchOutlined />}
          placeholder="Sotuvchi nomi bo‘yicha qidirish"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (selectedSellerId && typeof onClear === 'function') {
              onClear();
            }
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onPressEnter={handleSubmitSearch}
          allowClear={!selectedSellerId}
        />

        {isOpen ? (
          <div className="product-seller-search__dropdown" role="listbox">
            {filteredSellers.length === 0 ? (
              <p className="product-seller-search__empty">Sotuvchi topilmadi</p>
            ) : (
              filteredSellers.map((seller) => {
                const name = getLocalizedText(seller.name, 'uz');
                const isSelected = String(seller.id) === String(selectedSellerId);

                return (
                  <button
                    key={seller.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`product-seller-search__option${isSelected ? ' product-seller-search__option--active' : ''}`}
                    onClick={() => handleSelectSeller(seller)}
                  >
                    <img
                      className="product-seller-search__option-logo"
                      src={seller.logoUrl || resolveProductImageUrl(seller.logo)}
                      alt={name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = resolveProductImageUrl('');
                      }}
                    />
                    <span className="product-seller-search__option-name">{name}</span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      {selectedSellerId ? (
        <Button
          type="text"
          icon={<SyncOutlined />}
          className="product-seller-search__back"
          onClick={handleClear}
        >
          Ortga
        </Button>
      ) : null}
    </div>
  );
}
