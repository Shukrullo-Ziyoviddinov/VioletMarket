import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatSellerEarningsAmount } from '../../../utils/sellerEarningsDisplay';
import './SellerEarningsSoldProductsFooter.css';

export default function SellerEarningsSoldProductsFooter({
  selectedCount = 0,
  selectedTotal = 0,
  submitting = false,
  onSubmit,
}) {
  const { t } = useTranslation();

  return (
    <div className="seller-earnings-sold-products-footer">
      <div className="seller-earnings-sold-products-footer__summary">
        <span>
          {t('sellerEarnings.soldProducts.footer.selectedCount', { count: selectedCount })}
        </span>
        <span className="seller-earnings-sold-products-footer__total">
          {t('sellerEarnings.soldProducts.footer.selectedTotal', {
            amount: formatSellerEarningsAmount(selectedTotal),
          })}
        </span>
      </div>

      <button
        type="button"
        className="seller-earnings-sold-products-footer__submit"
        disabled={submitting || selectedCount === 0}
        onClick={onSubmit}
      >
        {submitting
          ? t('sellerEarnings.soldProducts.footer.submitting')
          : t('sellerEarnings.soldProducts.footer.submit')}
      </button>
    </div>
  );
}
