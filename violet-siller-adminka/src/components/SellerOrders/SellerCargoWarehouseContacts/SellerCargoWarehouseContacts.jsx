import React from 'react';
import { useTranslation } from 'react-i18next';
import './SellerCargoWarehouseContacts.css';

export default function SellerCargoWarehouseContacts({
  loading = false,
  error = '',
  sellerCountry = '',
  contacts = [],
}) {
  const { t } = useTranslation();
  const countryLabel = sellerCountry
    ? t(`orders.cargo.warehouseContacts.countries.${sellerCountry}`, {
        defaultValue: sellerCountry.toUpperCase(),
      })
    : '';

  if (loading) {
    return (
      <div className="seller-cargo-warehouse-contacts seller-cargo-warehouse-contacts--state">
        {t('orders.cargo.warehouseContacts.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="seller-cargo-warehouse-contacts seller-cargo-warehouse-contacts--error">
        {error}
      </div>
    );
  }

  if (!contacts.length) {
    return (
      <div className="seller-cargo-warehouse-contacts seller-cargo-warehouse-contacts--state">
        {countryLabel
          ? t('orders.cargo.warehouseContacts.emptyForCountry', {
              country: countryLabel,
            })
          : t('orders.cargo.warehouseContacts.empty')}
      </div>
    );
  }

  return (
    <div className="seller-cargo-warehouse-contacts">
      <p className="seller-cargo-warehouse-contacts__hint">
        {t('orders.cargo.warehouseContacts.hint')}
        {countryLabel ? ` (${countryLabel})` : ''}:
      </p>
      <div className="seller-cargo-warehouse-contacts__list">
        {contacts.map((item) => (
          <article key={item.id} className="seller-cargo-warehouse-contacts__card">
            <strong className="seller-cargo-warehouse-contacts__name">
              {item.companyName}
            </strong>
            {item.chinaAddress ? (
              <p>
                <span>{t('orders.cargo.warehouseContacts.address')}</span>
                {item.chinaAddress}
              </p>
            ) : null}
            {item.chinaPhone ? (
              <p>
                <span>{t('orders.cargo.warehouseContacts.phone')}</span>
                {item.chinaPhone}
              </p>
            ) : null}
            {item.profileDescription ? (
              <p>
                <span>{t('orders.cargo.warehouseContacts.description')}</span>
                {item.profileDescription}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
