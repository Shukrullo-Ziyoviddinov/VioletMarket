import React, { useEffect, useState } from 'react';
import { Button, Input, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import SellerYandexMap from '../SellerYandexMap/SellerYandexMap';
import './SellerYandexMapModal.css';

const DEFAULT_CENTER = [41.311151, 69.279737];

function resolveInitialCoords(coordinates) {
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const lat = Number(coordinates[0]);
    const lng = Number(coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  }
  return DEFAULT_CENTER;
}

export default function SellerYandexMapModal({
  open = false,
  initialAddress = '',
  initialCoordinates = null,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();
  const [address, setAddress] = useState(initialAddress || '');
  const [coordinates, setCoordinates] = useState(resolveInitialCoords(initialCoordinates));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    setAddress(initialAddress || '');
    setCoordinates(resolveInitialCoords(initialCoordinates));

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, initialAddress, initialCoordinates, onClose]);

  if (!open) return null;

  const handleLocationChange = ({ coords, address: nextAddress }) => {
    if (Array.isArray(coords) && coords.length >= 2) {
      setCoordinates([Number(coords[0]), Number(coords[1])]);
    }
    if (nextAddress) {
      setAddress(nextAddress);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.({
        address: String(address || '').trim(),
        coordinates,
      });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="seller-yandex-map-modal" role="presentation">
      <button
        type="button"
        className="seller-yandex-map-modal__backdrop"
        aria-label={t('marketInfo.cancel')}
        onClick={onClose}
      />

      <div className="seller-yandex-map-modal__center">
        <div
          className="seller-yandex-map-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-yandex-map-modal-title"
        >
          <header className="seller-yandex-map-modal__header">
            <h2 id="seller-yandex-map-modal-title" className="seller-yandex-map-modal__title">
              {t('marketInfo.mapTitle')}
            </h2>
            <button
              type="button"
              className="seller-yandex-map-modal__close"
              onClick={onClose}
              aria-label={t('marketInfo.cancel')}
            >
              ×
            </button>
          </header>

          <div className="seller-yandex-map-modal__body">
            <label className="seller-yandex-map-modal__label" htmlFor="seller-map-address-input">
              {t('marketInfo.address')}
            </label>
            <Input
              id="seller-map-address-input"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder={t('marketInfo.placeholderAddress')}
              className="seller-yandex-map-modal__input"
            />

            <SellerYandexMap
              isVisible={open}
              center={coordinates}
              autoLocate={!initialCoordinates}
              onLocationChange={handleLocationChange}
            />

            <p className="seller-yandex-map-modal__hint">{t('marketInfo.mapHint')}</p>

            <Space wrap className="seller-yandex-map-modal__actions">
              <Button onClick={onClose}>{t('marketInfo.cancel')}</Button>
              <Button type="primary" loading={saving} onClick={handleSave}>
                {t('marketInfo.saveAddress')}
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
