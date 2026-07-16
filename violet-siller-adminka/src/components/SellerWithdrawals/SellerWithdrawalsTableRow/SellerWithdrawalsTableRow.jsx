import React from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  formatSellerEarningsAmount,
  formatSellerEarningsSoldProductDate,
  getSoldProductTitle,
} from '../../../utils/sellerEarningsDisplay';
import './SellerWithdrawalsTableRow.css';

function formatRequestCode(code) {
  const value = String(code || '').trim();
  if (!value) return '—';
  return value.startsWith('#') ? value : `#${value}`;
}

export default function SellerWithdrawalsTableRow({ withdrawal, onView }) {
  const { i18n, t } = useTranslation();
  const title = getSoldProductTitle(withdrawal, i18n.language);

  return (
    <tr className="seller-withdrawals-table-row">
      <td className="seller-withdrawals-table-row__code">
        <strong>{formatRequestCode(withdrawal.requestCode)}</strong>
      </td>
      <td className="seller-withdrawals-table-row__product-cell">
        <div className="seller-withdrawals-table-row__product">
          <div className="seller-withdrawals-table-row__product-image">
            {withdrawal.imageUrl ? (
              <img src={withdrawal.imageUrl} alt={title} />
            ) : (
              <span>—</span>
            )}
          </div>
          <div className="seller-withdrawals-table-row__product-text">
            <strong title={title}>{title}</strong>
            <p>{withdrawal.productCode}</p>
          </div>
        </div>
      </td>
      <td className="seller-withdrawals-table-row__date">
        {formatSellerEarningsSoldProductDate(withdrawal.withdrawnAt)}
      </td>
      <td className="seller-withdrawals-table-row__amount">
        {formatSellerEarningsAmount(withdrawal.amount)}
      </td>
      <td className="seller-withdrawals-table-row__actions">
        <button
          type="button"
          className="seller-withdrawals-table-row__view-btn"
          aria-label={t('sellerWithdrawals.actions.view')}
          onClick={() => onView?.(withdrawal)}
        >
          <EyeOutlined />
        </button>
      </td>
    </tr>
  );
}
