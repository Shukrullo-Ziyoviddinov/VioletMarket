import React, { useState } from 'react';
import { EnvironmentOutlined } from '@ant-design/icons';
import { Input, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerYandexMapModal from '../SellerYandexMapModal/SellerYandexMapModal';
import './MarketAddressField.css';

const { Text } = Typography;

export default function MarketAddressField({
  address = '',
  coordinates = null,
  disabled = false,
  onChange,
}) {
  const { t } = useTranslation();
  const [mapOpen, setMapOpen] = useState(false);

  const handleOpenMap = () => {
    if (disabled) return;
    setMapOpen(true);
  };

  const handleSave = ({ address: nextAddress, coordinates: nextCoordinates }) => {
    onChange?.({
      address: nextAddress,
      coordinates: nextCoordinates,
    });
    setMapOpen(false);
  };

  return (
    <div className="market-address-field">
      <div className="market-address-field__head">
        <div className="market-address-field__icon-wrap">
          <EnvironmentOutlined />
        </div>
        <Text className="market-address-field__title">{t('marketInfo.enterAddress')}</Text>
      </div>

      <button
        type="button"
        className="market-address-field__trigger"
        onClick={handleOpenMap}
        disabled={disabled}
      >
        <Input
          readOnly
          value={address || ''}
          placeholder={t('marketInfo.placeholderAddress')}
          className="market-address-field__input"
          disabled={disabled}
        />
      </button>

      {Array.isArray(coordinates) && coordinates.length >= 2 ? (
        <Text className="market-address-field__coords">
          {t('marketInfo.coordinates')}: {Number(coordinates[0]).toFixed(6)},{' '}
          {Number(coordinates[1]).toFixed(6)}
        </Text>
      ) : null}

      <SellerYandexMapModal
        open={mapOpen}
        initialAddress={address}
        initialCoordinates={coordinates}
        onClose={() => setMapOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
