import React from 'react';
import './SalesStatisticsMoreButton.css';

export default function SalesStatisticsMoreButton({ onClick }) {
  return (
    <button
      type="button"
      className="sales-statistics-more-button"
      onClick={onClick}
    >
      Ko&apos;proq
    </button>
  );
}
