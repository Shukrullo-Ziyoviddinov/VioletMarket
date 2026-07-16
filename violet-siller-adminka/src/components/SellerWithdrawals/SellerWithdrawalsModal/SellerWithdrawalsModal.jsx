import React from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../../GlobalModal/GlobalModal';
import {
  formatSellerEarningsAmount,
  formatSellerEarningsSoldProductDate,
  getSoldProductTitle,
} from '../../../utils/sellerEarningsDisplay';
import './SellerWithdrawalsModal.css';

function formatRequestCode(code) {
  const value = String(code || '').trim();
  if (!value) return '—';
  return value.startsWith('#') ? value : `#${value}`;
}

function formatDateTime(value) {
  return formatSellerEarningsSoldProductDate(value) || '—';
}

export default function SellerWithdrawalsModal({ open, withdrawal, onClose }) {
  const { t, i18n } = useTranslation();
  const title = withdrawal
    ? t('sellerWithdrawals.modal.titleWithCode', {
        code: formatRequestCode(withdrawal.requestCode),
      })
    : t('sellerWithdrawals.modal.title');
  const productTitle = withdrawal
    ? getSoldProductTitle(withdrawal, i18n.language)
    : '';

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      {!withdrawal ? (
        <p className="seller-withdrawals-modal__empty">{t('sellerWithdrawals.modal.empty')}</p>
      ) : (
        <div className="seller-withdrawals-modal">
          <div className="seller-withdrawals-modal__product">
            <div className="seller-withdrawals-modal__image">
              {withdrawal.imageUrl ? (
                <img src={withdrawal.imageUrl} alt={productTitle} />
              ) : (
                <span>—</span>
              )}
            </div>
            <div>
              <strong>{productTitle}</strong>
              <p>{withdrawal.productCode}</p>
            </div>
          </div>

          <div className="seller-withdrawals-modal__info">
            <div className="seller-withdrawals-modal__row">
              <span>{t('sellerWithdrawals.modal.submittedAt')}</span>
              <strong>{formatDateTime(withdrawal.submittedAt)}</strong>
            </div>
            <div className="seller-withdrawals-modal__row">
              <span>{t('sellerWithdrawals.modal.withdrawnAt')}</span>
              <strong>{formatDateTime(withdrawal.withdrawnAt)}</strong>
            </div>
            <div className="seller-withdrawals-modal__row">
              <span>{t('sellerWithdrawals.modal.amount')}</span>
              <strong>{formatSellerEarningsAmount(withdrawal.amount)}</strong>
            </div>
          </div>
        </div>
      )}
    </GlobalModal>
  );
}
