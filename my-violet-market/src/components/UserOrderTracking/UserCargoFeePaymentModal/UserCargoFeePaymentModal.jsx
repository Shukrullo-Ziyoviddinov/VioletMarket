import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../../GlobalModal';
import { formatPrice, getLocalizedText, normalizeImagePath } from '../../../utils/utils';
import {
  formatCargoServiceTypeLabel,
  isKnownCargoServiceType,
  normalizeCargoServiceType,
} from '../../../utils/cargoExpressPolicy';
import { payMyCargoFee } from '../../../api/orderTrackingApi';
import { useUser } from '../../../contexts/UserContext';
import './UserCargoFeePaymentModal.css';

const PAYME_LOGO = '/img/payme-logo.png';
const CLICK_LOGO = '/img/click_preview_rev_1.png';

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`;
}

function resolveProductLines(order) {
  if (Array.isArray(order?.products) && order.products.length) {
    return order.products;
  }
  return [
    {
      id: order?.id,
      title: order?.title,
      imageUrl: order?.imageUrl,
      quantity: order?.quantity,
      lineTotal: order?.lineTotal || order?.price,
      weightKg: order?.cargoFeePayment?.weightKg || 0,
      uzArrivalComment: '',
      uzArrivalPhotoUrl: '',
      cargoShipmentId: order?.cargoShipmentId || null,
    },
  ];
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
  const products = resolveProductLines(order);
  const isGroup = products.length > 1;
  const alreadyPaid = Boolean(payment?.customerPaidAt);
  const canPay = Boolean(payment?.canCustomerPay) && !alreadyPaid;
  const feeBearerId = order?.cargoShipmentId
    ? String(order.cargoShipmentId)
    : '';

  // Guruh izoh/surat — faqat fee-bearer dan bir marta (mahsulot qatorlarida takrorlanmasin)
  const groupComment = String(payment?.uzArrivalComment || '').trim();
  const groupPhoto = String(payment?.uzArrivalPhotoUrl || '').trim();

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
        <div className="user-cargo-fee-modal__products">
          {isKnownCargoServiceType(order?.cargoServiceType) ? (
            <p className="user-cargo-fee-modal__group-label">
              {formatCargoServiceTypeLabel(order.cargoServiceType, {
                express: t('orderHistory.cargoExpress'),
                standard: t('orderHistory.cargoStandard'),
              })}
              {' · '}
              {t('orderHistory.cargoFee.laneHint')}
            </p>
          ) : null}

          {isGroup ? (
            <p className="user-cargo-fee-modal__group-label">
              {t('orderHistory.cargoFee.groupProducts', {
                count: products.length,
              })}
            </p>
          ) : null}

          {products.map((product) => {
            const title =
              getLocalizedText(product.title, lang) ||
              t('orderHistory.productFallback');
            const weightKg = Number(product.weightKg) || 0;
            const isBearer =
              feeBearerId &&
              String(product.cargoShipmentId || '') === feeBearerId;
            // Siblingda o‘z comment/photo bo‘lsa ko‘rsat; bearer media guruh blokida
            const ownComment = String(product.uzArrivalComment || '').trim();
            const ownPhoto = String(product.uzArrivalPhotoUrl || '').trim();
            const showOwnMedia =
              !isBearer &&
              ((ownComment && ownComment !== groupComment) ||
                (ownPhoto && ownPhoto !== groupPhoto));

            return (
              <div key={product.id} className="user-cargo-fee-modal__product-row">
                <img
                  src={normalizeImagePath(product.imageUrl)}
                  alt={title}
                  className="user-cargo-fee-modal__image"
                />
                <div className="user-cargo-fee-modal__info">
                  <strong>{title}</strong>
                  <span>
                    {t('orderHistory.quantity', {
                      count: product.quantity || 1,
                    })}
                  </span>
                  {weightKg > 0 ? (
                    <span className="user-cargo-fee-modal__item-weight">
                      {t('orderHistory.cargoFee.itemWeight', {
                        weight: weightKg,
                      })}
                    </span>
                  ) : null}
                  <span>{formatPrice(product.lineTotal || product.price)}</span>
                  {showOwnMedia ? (
                    <div className="user-cargo-fee-modal__item-media">
                      {ownPhoto ? (
                        <img
                          src={normalizeImagePath(ownPhoto)}
                          alt=""
                          className="user-cargo-fee-modal__photo user-cargo-fee-modal__photo--small"
                        />
                      ) : null}
                      {ownComment ? (
                        <span className="user-cargo-fee-modal__item-comment">
                          {ownComment}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="user-cargo-fee-modal__logistics">
          <h3>{t('orderHistory.cargoFee.logisticsInfo')}</h3>

          {groupPhoto ? (
            <img
              src={normalizeImagePath(groupPhoto)}
              alt=""
              className="user-cargo-fee-modal__photo"
            />
          ) : null}

          {isGroup ? (
            <p>
              <span>{t('orderHistory.cargoFee.totalWeight')}</span>
              <strong>{payment?.weightKg || 0} kg</strong>
            </p>
          ) : (
            <p>
              <span>{t('orderHistory.cargoFee.weight')}</span>
              <strong>{payment?.weightKg || 0} kg</strong>
            </p>
          )}

          <p>
            <span>{t('orderHistory.cargoFee.fee')}</span>
            <strong>{formatMoney(payment?.cargoDeliveryFee)}</strong>
          </p>
          <p className="user-cargo-fee-modal__fee-hint">
            {isKnownCargoServiceType(order?.cargoServiceType)
              ? t('orderHistory.cargoFee.onePaymentHint', {
                  lane: formatCargoServiceTypeLabel(order.cargoServiceType, {
                    express: t('orderHistory.cargoExpress'),
                    standard: t('orderHistory.cargoStandard'),
                  }),
                })
              : t('orderHistory.cargoFee.laneHint')}
          </p>

          {groupComment ? (
            <p className="user-cargo-fee-modal__comment">
              <span>{t('orderHistory.cargoFee.comment')}</span>
              <strong>{groupComment}</strong>
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
