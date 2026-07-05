import React from 'react';
import './PaymentRequestPagination.css';

export default function PaymentRequestPagination({ page = 1, totalPages = 1, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="payment-request-pagination" aria-label="So'rovlar sahifalari">
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={`payment-request-pagination__btn${
            pageNumber === page ? ' payment-request-pagination__btn--active' : ''
          }`}
          onClick={() => onChange?.(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}
    </nav>
  );
}
