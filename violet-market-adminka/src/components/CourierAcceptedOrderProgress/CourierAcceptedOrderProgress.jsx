import React from 'react';
import { getCourierAssignmentProgress } from '../../utils/courierAssignmentStatus';
import './CourierAcceptedOrderProgress.css';

export default function CourierAcceptedOrderProgress({ status }) {
  const { steps, variant } = getCourierAssignmentProgress(status);
  const isReturned = variant === 'returned';

  return (
    <div
      className={`courier-accepted-order-progress${
        isReturned ? ' courier-accepted-order-progress--returned' : ''
      }`}
      aria-label="Kuryer pozitsiyasi"
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          {index > 0 ? (
            <span
              className={`courier-accepted-order-progress__line${
                step.done ? ' courier-accepted-order-progress__line--done' : ''
              }`}
              aria-hidden="true"
            />
          ) : null}
          <div
            className={`courier-accepted-order-progress__step${
              step.done ? ' courier-accepted-order-progress__step--done' : ''
            }${step.current ? ' courier-accepted-order-progress__step--current' : ''}`}
          >
            <span className="courier-accepted-order-progress__dot" />
            <span className="courier-accepted-order-progress__label">{step.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
