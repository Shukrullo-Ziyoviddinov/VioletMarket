import React from 'react';
import { formatRevenue, resolveProductImageUrl } from '../../../utils/productDisplay';
import './ReturnedProductsSellerRankings.css';

function RankingColumn({ title, rows, emptyText }) {
  return (
    <article className="returned-products-seller-rankings__column">
      <h3 className="returned-products-seller-rankings__title">{title}</h3>
      {!rows.length ? (
        <p className="returned-products-seller-rankings__empty">{emptyText}</p>
      ) : (
        <ul className="returned-products-seller-rankings__list">
          {rows.map((row, index) => (
            <li key={`${row.sellerId}-${index}`} className="returned-products-seller-rankings__item">
              <div className="returned-products-seller-rankings__seller">
                <img
                  src={resolveProductImageUrl(row.seller?.logo)}
                  alt={row.seller?.name || 'Siller'}
                  onError={(event) => {
                    event.currentTarget.src = resolveProductImageUrl('');
                  }}
                />
                <div>
                  <strong>{row.seller?.name || '—'}</strong>
                  <span>{formatRevenue(row.amount)}</span>
                </div>
              </div>
              <strong className="returned-products-seller-rankings__count">{row.count}</strong>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function ReturnedProductsSellerRankings({
  rankings,
  loading = false,
}) {
  const returnRows = Array.isArray(rankings?.return) ? rankings.return : [];
  const defectiveRows = Array.isArray(rankings?.defective) ? rankings.defective : [];

  return (
    <section className="returned-products-seller-rankings">
      <RankingColumn
        title="Ko'p qaytarilgan buyurtmalar sotuvchisi"
        rows={loading ? [] : returnRows}
        emptyText={loading ? 'Yuklanmoqda...' : 'Ma’lumot yo‘q'}
      />
      <RankingColumn
        title="Ko'p yaroqsiz buyurtmalar sotuvchisi"
        rows={loading ? [] : defectiveRows}
        emptyText={loading ? 'Yuklanmoqda...' : 'Ma’lumot yo‘q'}
      />
    </section>
  );
}
