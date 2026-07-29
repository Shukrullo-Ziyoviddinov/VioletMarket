import React from 'react';
import './SellerCargoWarehouseContacts.css';

export default function SellerCargoWarehouseContacts({
  loading = false,
  error = '',
  sellerCountryLabel = '',
  contacts = [],
}) {
  if (loading) {
    return (
      <div className="seller-cargo-warehouse-contacts seller-cargo-warehouse-contacts--state">
        Manzillar yuklanmoqda...
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
        {sellerCountryLabel
          ? `${sellerCountryLabel} bo‘yicha logistica manzili hali kiritilmagan.`
          : 'Logistica manzili hali kiritilmagan.'}
      </div>
    );
  }

  return (
    <div className="seller-cargo-warehouse-contacts">
      <p className="seller-cargo-warehouse-contacts__hint">
        Mahsulotni quyidagi cargo manziliga yuboring
        {sellerCountryLabel ? ` (${sellerCountryLabel})` : ''}:
      </p>
      <div className="seller-cargo-warehouse-contacts__list">
        {contacts.map((item) => (
          <article key={item.id} className="seller-cargo-warehouse-contacts__card">
            <strong className="seller-cargo-warehouse-contacts__name">
              {item.companyName}
            </strong>
            {item.chinaAddress ? (
              <p>
                <span>Manzil</span>
                {item.chinaAddress}
              </p>
            ) : null}
            {item.chinaPhone ? (
              <p>
                <span>Telefon</span>
                {item.chinaPhone}
              </p>
            ) : null}
            {item.profileDescription ? (
              <p>
                <span>Tavsif</span>
                {item.profileDescription}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
