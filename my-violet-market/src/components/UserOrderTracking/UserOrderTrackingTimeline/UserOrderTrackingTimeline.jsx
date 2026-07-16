import React from 'react';
import { useTranslation } from 'react-i18next';
import './UserOrderTrackingTimeline.css';

const STEP_ICONS = {
  accepted: 'bx bx-clipboard',
  seller_confirmed: 'bx bx-check-shield',
  collected: 'bx bx-package',
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

export default function UserOrderTrackingTimeline({ steps = [] }) {
  const { t } = useTranslation();

  return (
    <div className="user-order-tracking" aria-label={t('orderHistory.tracking')}>
      {steps.map((step, index) => (
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
            {t(`orderHistory.steps.${step.status}.title`)}
          </strong>
          <p className="user-order-tracking__description">
            {t(`orderHistory.steps.${step.status}.description`)}
          </p>
          <span className="user-order-tracking__date">
            <i className={step.occurredAt ? 'bx bx-calendar' : 'bx bx-time-five'} />
            {formatStepDate(step.occurredAt, t)}
          </span>
        </div>
      ))}
    </div>
  );
}
