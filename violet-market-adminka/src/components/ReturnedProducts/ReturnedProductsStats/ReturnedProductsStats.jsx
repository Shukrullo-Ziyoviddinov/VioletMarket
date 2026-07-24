import React from 'react';
import { formatRevenue } from '../../../utils/productDisplay';
import './ReturnedProductsStats.css';

export default function ReturnedProductsStats({ stats, loading = false }) {
  const day = stats?.day || {};
  const week = stats?.week || {};
  const month = stats?.month || {};
  const allTime = stats?.allTime || {};

  const cards = [
    {
      id: 'day',
      title: 'Kunlik',
      count: day.totalCount || 0,
      amount: day.totalAmount || 0,
      returnCount: day.returnCount || 0,
      defectiveCount: day.defectiveCount || 0,
    },
    {
      id: 'week',
      title: 'Haftalik',
      count: week.totalCount || 0,
      amount: week.totalAmount || 0,
      returnCount: week.returnCount || 0,
      defectiveCount: week.defectiveCount || 0,
    },
    {
      id: 'month',
      title: 'Oylik',
      count: month.totalCount || 0,
      amount: month.totalAmount || 0,
      returnCount: month.returnCount || 0,
      defectiveCount: month.defectiveCount || 0,
    },
    {
      id: 'all',
      title: 'Jami',
      count: allTime.totalCount || 0,
      amount: allTime.totalAmount || 0,
      returnCount: allTime.returnCount || 0,
      defectiveCount: allTime.defectiveCount || 0,
    },
  ];

  return (
    <div className="returned-products-stats">
      {cards.map((card) => (
        <article key={card.id} className="returned-products-stats__card">
          <p className="returned-products-stats__title">{card.title}</p>
          <p className="returned-products-stats__count">{loading ? '—' : card.count}</p>
          <p className="returned-products-stats__amount">
            {loading ? '—' : formatRevenue(card.amount)}
          </p>
          <p className="returned-products-stats__split">
            Qaytarilgan: {loading ? '—' : card.returnCount} · Yaroqsiz:{' '}
            {loading ? '—' : card.defectiveCount}
          </p>
        </article>
      ))}
    </div>
  );
}
