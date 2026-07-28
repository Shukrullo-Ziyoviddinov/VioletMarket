import React from 'react';
import './LogisticaShipmentsCountryFilter.css';

export default function LogisticaShipmentsCountryFilter({
  countries = [],
  value = '',
  onChange,
}) {
  if (!countries.length) {
    return (
      <div className="logistica-shipments-filter logistica-shipments-filter--empty">
        Hozircha qabul qilingan yuklar yo‘q
      </div>
    );
  }

  return (
    <div
      className="logistica-shipments-filter"
      role="tablist"
      aria-label="Logistica davlat filtri"
    >
      {countries.map((country) => {
        const active = value === country.code;
        return (
          <button
            key={country.code}
            type="button"
            role="tab"
            aria-selected={active}
            className={`logistica-shipments-filter__button${
              active ? ' logistica-shipments-filter__button--active' : ''
            }`}
            onClick={() => onChange?.(country.code)}
          >
            <span className="logistica-shipments-filter__label">
              {country.label}
            </span>
            <span className="logistica-shipments-filter__count">
              {country.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
