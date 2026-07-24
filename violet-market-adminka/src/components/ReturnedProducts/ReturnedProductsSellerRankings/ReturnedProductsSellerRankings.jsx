import React from 'react';
import { formatRevenue, resolveProductImageUrl } from '../../../utils/productDisplay';
import './ReturnedProductsSellerRankings.css';

function RankingColumn({ title, rows, emptyText, countLabel }) {
  return (
    <article className="returned-products-seller-rankings__column">
      <h3 className="returned-products-seller-rankings__title">{title}</h3>
      {!rows.length ? (
        <p className="returned-products-seller-rankings__empty">{emptyText}</p>
      ) : (
        <ol className="returned-products-seller-rankings__list">
          {rows.map((row, index) => (
            <li key={`${row.sellerId}-${index}`} className="returned-products-seller-rankings__item">
              <span className="returned-products-seller-rankings__rank" aria-hidden="true">
                {index + 1}
              </span>
              <div className="returned-products-seller-rankings__seller">
                <img
                  src={resolveProductImageUrl(row.seller?.logo)}
                  alt={row.seller?.name || 'Sotuvchi'}
                  onError={(event) => {
                    event.currentTarget.src = resolveProductImageUrl('');
                  }}
                />
                <div className="returned-products-seller-rankings__info">
                  <strong className="returned-products-seller-rankings__name">
                    {row.seller?.name || '—'}
                  </strong>
                  <p className="returned-products-seller-rankings__meta">
                    <span>
                      {countLabel}: <b>{row.count || 0} ta</b>
                    </span>
                    <span>
                      Summa: <b>{formatRevenue(row.amount)}</b>
                    </span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
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
        countLabel="Qaytarilgan"
        emptyText={loading ? 'Yuklanmoqda...' : 'Ma’lumot yo‘q'}
      />
      <RankingColumn
        title="Ko'p yaroqsiz buyurtmalar sotuvchisi"
        rows={loading ? [] : defectiveRows}
        countLabel="Yaroqsiz"
        emptyText={loading ? 'Yuklanmoqda...' : 'Ma’lumot yo‘q'}
      />
    </section>
  );
}
