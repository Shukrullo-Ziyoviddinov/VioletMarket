import React from 'react';
import { formatSellerCountry, getSellerCountryCode } from '../../utils/sellerCountryDisplay';
import '../SellersTable/SellersTable.css';

export default function SellerTableExpandedRow({ record }) {
  const country = getSellerCountryCode(record);

  return (
    <div className="sellers-table__expanded">
      <span className="sellers-table__expanded-label">Sotuvchi davlati:</span>
      <span className="sellers-table__expanded-value">{formatSellerCountry(country)}</span>
    </div>
  );
}
