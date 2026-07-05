import React from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import './PaymentRequestPagination.css';

function buildPageItems(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = [1];

  if (page > 3) items.push('ellipsis-start');

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    items.push(current);
  }

  if (page < totalPages - 2) items.push('ellipsis-end');

  items.push(totalPages);
  return items;
}

export default function PaymentRequestPagination({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onChange,
}) {
  if (totalPages <= 1 && total <= limit) return null;

  const pages = buildPageItems(page, totalPages);

  return (
    <div className="payment-request-pagination">
      <div className="payment-request-pagination__controls">
        <button
          type="button"
          className="payment-request-pagination__arrow"
          disabled={page <= 1}
          onClick={() => onChange?.(page - 1)}
          aria-label="Oldingi sahifa"
        >
          <LeftOutlined />
        </button>

        {pages.map((item) => {
          if (typeof item === 'string') {
            return (
              <span key={item} className="payment-request-pagination__ellipsis">
                ...
              </span>
            );
          }

          return (
            <button
              key={item}
              type="button"
              className={`payment-request-pagination__btn${
                item === page ? ' payment-request-pagination__btn--active' : ''
              }`}
              onClick={() => onChange?.(item)}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          className="payment-request-pagination__arrow"
          disabled={page >= totalPages}
          onClick={() => onChange?.(page + 1)}
          aria-label="Keyingi sahifa"
        >
          <RightOutlined />
        </button>
      </div>

      <div className="payment-request-pagination__size">{limit} / sahifa</div>
    </div>
  );
}
