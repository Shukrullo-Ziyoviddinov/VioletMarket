import React from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeCountryCode } from '../../../utils/warehouseProduct';
import './UserOrderTrackingTimeline.css';

const STEP_ICONS = {
  accepted: 'bx bx-clipboard',
  seller_confirmed: 'bx bx-check-shield',
  collected: 'bx bx-package',
  ready_for_cargo: 'bx bx-box',
  handed_to_cargo: 'bx bx-transfer-alt',
  xitoy_omborida: 'bx bx-buildings',
  yolda: 'bx bx-trip',
  bojxonada: 'bx bx-file',
  toshkent_omborida: 'bx bx-home-alt',
  handed_to_courier: 'bx bx-cycling',
  delivered: 'bx bx-check-circle',
};

function formatStepDate(value, t) {
  if (!value) return t('orderHistory.waiting');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('orderHistory.waiting');

  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function resolveWarehouseCountryLabel(sellerCountry, t) {
  const code = normalizeCountryCode(sellerCountry);
  if (!code || code === 'uzb') {
    return t('orderHistory.countries.foreign');
  }

  const key = `orderHistory.countries.${code}`;
  const label = t(key);
  if (label && label !== key) return label;

  return t('orderHistory.countries.foreign');
}

export default function UserOrderTrackingTimeline({
  steps = [],
  sellerCountry = '',
}) {
  const { t } = useTranslation();
  const warehouseCountry = resolveWarehouseCountryLabel(sellerCountry, t);

  return (
    <div className="user-order-tracking" aria-label={t('orderHistory.tracking')}>
      {steps.map((step, index) => {
        const stepKey = `orderHistory.steps.${step.status}`;
        const titleKey = `${stepKey}.title`;
        const descriptionKey = `${stepKey}.description`;
        const useCountry = step.status === 'xitoy_omborida';

        return (
          <div
            key={step.status}
            className={`user-order-tracking__step user-order-tracking__step--${step.state}`}
          >
            {index < steps.length - 1 ? (
              <span className="user-order-tracking__line" aria-hidden="true" />
            ) : null}

            <div className="user-order-tracking__marker">
              <span className="user-order-tracking__number">{index + 1}</span>
              <span className="user-order-tracking__icon" aria-hidden="true">
                <i className={STEP_ICONS[step.status] || 'bx bx-circle'} />
              </span>
            </div>

            <strong className="user-order-tracking__title">
              {useCountry
                ? t(titleKey, { country: warehouseCountry })
                : t(titleKey)}
            </strong>
            <p className="user-order-tracking__description">
              {useCountry
                ? t(descriptionKey, { country: warehouseCountry })
                : t(descriptionKey)}
            </p>
            <span className="user-order-tracking__date">
              <i className={step.occurredAt ? 'bx bx-calendar' : 'bx bx-time-five'} />
              {formatStepDate(step.occurredAt, t)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
