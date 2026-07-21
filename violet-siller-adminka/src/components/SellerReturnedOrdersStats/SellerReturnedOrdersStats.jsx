import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatSellerRevenue } from '../../utils/sellerSalesDisplay';
import './SellerReturnedOrdersStats.css';

export default function SellerReturnedOrdersStats({ stats, loading = false }) {
  const { t } = useTranslation();
  const day = stats?.day || {};
  const week = stats?.week || {};
  const month = stats?.month || {};
  const allTime = stats?.allTime || {};

  const cards = [
    {
      id: 'day',
      title: t('returnedOrders.stats.day'),
      count: day.totalCount || 0,
      amount: day.totalAmount || 0,
    },
    {
      id: 'week',
      title: t('returnedOrders.stats.week'),
      count: week.totalCount || 0,
      amount: week.totalAmount || 0,
    },
    {
      id: 'month',
      title: t('returnedOrders.stats.month'),
      count: month.totalCount || 0,
      amount: month.totalAmount || 0,
    },
    {
      id: 'all',
      title: t('returnedOrders.stats.allTime'),
      count: allTime.totalCount || 0,
      amount: allTime.totalAmount || 0,
    },
  ];

  return (
    <div className="seller-returned-orders-stats">
      {cards.map((card) => (
        <article key={card.id} className="seller-returned-orders-stats__card">
          <p className="seller-returned-orders-stats__title">{card.title}</p>
          <p className="seller-returned-orders-stats__count">
            {loading ? '—' : card.count}
          </p>
          <p className="seller-returned-orders-stats__amount">
            {loading ? '—' : formatSellerRevenue(card.amount)}
          </p>
        </article>
      ))}
    </div>
  );
}
