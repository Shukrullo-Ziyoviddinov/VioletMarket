import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatSellerEarningsAmount,
  formatSellerEarningsSoldProductDate,
  getSoldProductTitle,
  SELLER_EARNINGS_SOLD_PRODUCT_STATUS,
} from '../../../utils/sellerEarningsDisplay';
import './SellerEarningsSoldProductsTable.css';

const STATUS_LABEL_KEYS = {
  [SELLER_EARNINGS_SOLD_PRODUCT_STATUS.AVAILABLE]: 'sellerEarnings.soldProducts.status.available',
  [SELLER_EARNINGS_SOLD_PRODUCT_STATUS.IN_PROCESS]: 'sellerEarnings.soldProducts.status.inProcess',
  [SELLER_EARNINGS_SOLD_PRODUCT_STATUS.WITHDRAWN]: 'sellerEarnings.soldProducts.status.withdrawn',
  [SELLER_EARNINGS_SOLD_PRODUCT_STATUS.REJECTED]: 'sellerEarnings.soldProducts.status.rejected',
};

function isRowSelectable(row) {
  return row?.status === SELLER_EARNINGS_SOLD_PRODUCT_STATUS.AVAILABLE;
}

export default function SellerEarningsSoldProductsTable({
  rows = [],
  selectedIds = [],
  loading = false,
  onToggleRow,
  onToggleAll,
}) {
  const { t, i18n } = useTranslation();

  const selectableRows = rows.filter(isRowSelectable);
  const allSelected =
    selectableRows.length > 0 && selectableRows.every((row) => selectedIds.includes(row.id));
  const someSelected =
    selectableRows.some((row) => selectedIds.includes(row.id)) && !allSelected;

  return (
    <div className="seller-earnings-sold-products-table">
      {loading ? (
        <div className="seller-earnings-sold-products-table__loading">
          {t('sellerEarnings.soldProducts.loading')}
        </div>
      ) : rows.length === 0 ? (
        <div className="seller-earnings-sold-products-table__empty">
          {t('sellerEarnings.soldProducts.empty')}
        </div>
      ) : (
        <table className="seller-earnings-sold-products-table__table">
          <thead>
            <tr>
              <th className="seller-earnings-sold-products-table__checkbox-col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(event) => onToggleAll?.(event.target.checked, selectableRows)}
                  aria-label={t('sellerEarnings.soldProducts.selectAll')}
                />
              </th>
              <th>{t('sellerEarnings.soldProducts.columns.product')}</th>
              <th>{t('sellerEarnings.soldProducts.columns.soldAt')}</th>
              <th>{t('sellerEarnings.soldProducts.columns.price')}</th>
              <th>{t('sellerEarnings.soldProducts.columns.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selectable = isRowSelectable(row);
              const checked = selectedIds.includes(row.id);
              const title = getSoldProductTitle(row, i18n.language);

              return (
                <tr key={row.id}>
                  <td className="seller-earnings-sold-products-table__checkbox-col">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!selectable}
                      onChange={() => onToggleRow?.(row.id)}
                      aria-label={title}
                    />
                  </td>
                  <td>
                    <div className="seller-earnings-sold-products-table__product">
                      <img
                        src={row.imageUrl || `${process.env.PUBLIC_URL}/img/no-image.png`}
                        alt={title}
                        className="seller-earnings-sold-products-table__image"
                      />
                      <div>
                        <div className="seller-earnings-sold-products-table__title">{title}</div>
                        <div className="seller-earnings-sold-products-table__sku">{row.productCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="seller-earnings-sold-products-table__date">
                    {formatSellerEarningsSoldProductDate(row.soldAt)}
                  </td>
                  <td className="seller-earnings-sold-products-table__price">
                    {formatSellerEarningsAmount(row.price)}
                  </td>
                  <td>
                    <span
                      className={`seller-earnings-sold-products-table__badge seller-earnings-sold-products-table__badge--${row.status}`}
                    >
                      {t(STATUS_LABEL_KEYS[row.status] || STATUS_LABEL_KEYS.available)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
