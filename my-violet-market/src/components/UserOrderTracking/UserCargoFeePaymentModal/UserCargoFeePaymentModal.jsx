import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../../GlobalModal';
import { formatPrice, getLocalizedText, normalizeImagePath } from '../../../utils/utils';
import { payMyCargoFee } from '../../../api/orderTrackingApi';
import { useUser } from '../../../contexts/UserContext';
import './UserCargoFeePaymentModal.css';

const PAYME_LOGO = '/img/payme-logo.png';
const CLICK_LOGO = '/img/click_preview_rev_1.png';

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`;
}

export default function UserCargoFeePaymentModal({
  open,
  order,
  onClose,
  onPaid,
}) {
  const { t, i18n } = useTranslation();
  const { authToken } = useUser();
  const [method, setMethod] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const payment = order?.cargoFeePayment;
  const lang = i18n.language || 'uz';
  const title =
    getLocalizedText(order?.title, lang) || t('orderHistory.productFallback');
  const alreadyPaid = Boolean(payment?.customerPaidAt);
  const canPay = Boolean(payment?.canCustomerPay) && !alreadyPaid;

  const handleClose = () => {
    if (saving) return;
    setMethod('');
    setError('');
    onClose?.();
  };

  const handlePay = async () => {
    if (!canPay || !method || !order?.cargoShipmentId || !authToken || saving) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await payMyCargoFee(
        authToken,
        order.cargoShipmentId,
        method,
      );
      onPaid?.(result);
      handleClose();
    } catch (err) {
      setError(err?.message || t('orderHistory.cargoFee.payError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlobalModal
      isOpen={open}
      onClose={handleClose}
      title={t('orderHistory.cargoFee.modalTitle')}
    >
      <div className="user-cargo-fee-modal">
        <div className="user-cargo-fee-modal__product">
          {Array.isArray(order?.products) && order.products.length > 1 ? (
            <div className="user-cargo-fee-modal__info">
              <strong>
                {t('orderHistory.cargoFee.groupProducts', {
                  count: order.products.length,
                })}
              </strong>
              <span>
                {order.products
                  .map(
                    (row) =>
                      getLocalizedText(row.title, lang) ||
                      t('orderHistory.productFallback'),
                  )
                  .join(' · ')}
              </span>
              <span>{formatPrice(order?.lineTotal || order?.price)}</span>
            </div>
          ) : (
            <>
              <img
                src={normalizeImagePath(order?.imageUrl)}
                alt={title}
                className="user-cargo-fee-modal__image"
              />
              <div className="user-cargo-fee-modal__info">
                <strong>{title}</strong>
                <span>
                  {t('orderHistory.quantity', { count: order?.quantity || 1 })}
                </span>
                <span>{formatPrice(order?.lineTotal || order?.price)}</span>
              </div>
            </>
          )}
        </div>

        <div className="user-cargo-fee-modal__logistics">
          <h3>{t('orderHistory.cargoFee.logisticsInfo')}</h3>
          {payment?.uzArrivalPhotoUrl ? (
            <img
              src={normalizeImagePath(payment.uzArrivalPhotoUrl)}
              alt=""
              className="user-cargo-fee-modal__photo"
            />
          ) : null}
          <p>
            <span>{t('orderHistory.cargoFee.weight')}</span>
            <strong>{payment?.weightKg || 0} kg</strong>
          </p>
          <p>
            <span>{t('orderHistory.cargoFee.fee')}</span>
            <strong>{formatMoney(payment?.cargoDeliveryFee)}</strong>
          </p>
          {payment?.uzArrivalComment ? (
            <p className="user-cargo-fee-modal__comment">
              <span>{t('orderHistory.cargoFee.comment')}</span>
              <strong>{payment.uzArrivalComment}</strong>
            </p>
          ) : null}
        </div>

        {alreadyPaid ? (
          <p className="user-cargo-fee-modal__paid">
            {t('orderHistory.cargoFee.alreadyPaid')}
          </p>
        ) : (
          <>
            <div className="user-cargo-fee-modal__methods" role="group">
              <button
                type="button"
                className={`user-cargo-fee-modal__method${
                  method === 'payme' ? ' user-cargo-fee-modal__method--active' : ''
                }`}
                onClick={() => setMethod('payme')}
                disabled={saving}
              >
                <img src={PAYME_LOGO} alt="Payme" />
              </button>
              <button
                type="button"
                className={`user-cargo-fee-modal__method${
                  method === 'click' ? ' user-cargo-fee-modal__method--active' : ''
                }`}
                onClick={() => setMethod('click')}
                disabled={saving}
              >
                <img src={CLICK_LOGO} alt="Click" />
              </button>
            </div>

            {error ? <p className="user-cargo-fee-modal__error">{error}</p> : null}

            <button
              type="button"
              className="user-cargo-fee-modal__pay"
              disabled={!method || saving || !canPay}
              onClick={handlePay}
            >
              {saving
                ? t('orderHistory.cargoFee.paying')
                : t('orderHistory.cargoFee.pay')}
            </button>
          </>
        )}
      </div>
    </GlobalModal>
  );
}
