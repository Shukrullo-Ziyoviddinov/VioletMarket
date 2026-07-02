import React from 'react';
import { formatRevenue } from '../../utils/productDisplay';
import './SalesStatisticsTotalRevenue.css';

export default function SalesStatisticsTotalRevenue({ value, loading = false }) {
  return (
    <article className="sales-statistics-total-revenue">
      <p className="sales-statistics-total-revenue__label">Umumiy Daromad</p>
      <p className="sales-statistics-total-revenue__value">
        {loading ? '...' : formatRevenue(value)}
      </p>
    </article>
  );
}
