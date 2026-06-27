import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from 'antd';
import './SellerProductIdPicker.css';

function getLocalizedText(value, lang = 'uz') {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return String(value[lang] || value.uz || value.ru || '').trim();
}

export default function SellerProductIdPicker({
  value,
  options = [],
  usedIds,
  onSelect,
  disabled = false,
  placeholder = 'Mahsulot tanlang',
}) {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((item) => Number(item.id) === Number(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((item) => {
      if (usedIds.has(Number(item.id)) && Number(item.id) !== Number(value)) return false;
      if (!q) return true;
      const titleUz = getLocalizedText(item.title, 'uz').toLowerCase();
      const titleRu = getLocalizedText(item.title, 'ru').toLowerCase();
      return titleUz.includes(q) || titleRu.includes(q) || String(item.id).includes(q);
    });
  }, [options, query, usedIds, value]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const displayValue = selected
    ? `#${selected.id} — ${getLocalizedText(selected.title, 'uz')}`
    : '';

  return (
    <div className="seller-product-id-picker" ref={rootRef}>
      <Input
        size="large"
        readOnly
        disabled={disabled}
        value={isOpen ? query : displayValue}
        placeholder={placeholder}
        className={`seller-product-id-picker__input${isOpen ? ' seller-product-id-picker__input--open' : ''}`}
        onChange={(event) => setQuery(event.target.value)}
        onClick={() => {
          if (disabled) return;
          setIsOpen(true);
          setQuery('');
        }}
        onFocus={() => {
          if (disabled) return;
          setIsOpen(true);
        }}
      />

      {isOpen ? (
        <div className="seller-product-id-picker__panel" role="listbox">
          {filtered.length === 0 ? (
            <p className="seller-product-id-picker__empty">Mahsulot topilmadi</p>
          ) : (
            filtered.map((item) => {
              const isSelected = Number(item.id) === Number(value);
              return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className="seller-product-id-picker__option"
                onClick={() => {
                  onSelect(item.id);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <span className="seller-product-id-picker__option-id">#{item.id}</span>
                <span className="seller-product-id-picker__option-title">
                  {getLocalizedText(item.title, 'uz')}
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
