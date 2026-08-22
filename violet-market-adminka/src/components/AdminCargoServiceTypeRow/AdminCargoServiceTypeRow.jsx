import React from 'react';
import {
  formatCargoServiceTypeLabel,
  isKnownCargoServiceType,
} from '../../utils/cargoServiceRules';

/** Admin kartochkalarda Standard/Express tarif qatori. */
export default function AdminCargoServiceTypeRow({ value, className = '' }) {
  if (!isKnownCargoServiceType(value)) return null;
  return (
    <div className={className}>
      <span>Tarif</span>
      <strong>{formatCargoServiceTypeLabel(value)}</strong>
    </div>
  );
}
