import React, { useEffect, useState } from 'react';
import { message, Spin } from 'antd';
import GlobalModal from '../../GlobalModal/GlobalModal';
import {
  fetchAdminCargoShipmentDetail,
  updateAdminCargoShipmentProcessStep,
} from '../../../api/adminCargoShipmentsApi';
import './LogisticaShipmentDetailModal.css';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LogisticaShipmentDetailModal({
  open,
  shipmentId,
  onClose,
  onUpdated,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStep, setSelectedStep] = useState('');

  useEffect(() => {
    if (!open || !shipmentId) {
      setDetail(null);
      setSelectedStep('');
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAdminCargoShipmentDetail(shipmentId);
        if (cancelled) return;
        setDetail(data);
        setSelectedStep(data.processStep || '');
      } catch (error) {
        if (!cancelled) {
          message.error(error?.message || 'So‘rovni yuklab bo‘lmadi');
          onClose?.();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, shipmentId, onClose]);

  const handleConfirm = async () => {
    if (!detail?.id || !selectedStep || saving) return;
    if (selectedStep === detail.processStep) {
      message.info('Holat o‘zgarmagan');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminCargoShipmentProcessStep(
        detail.id,
        selectedStep,
      );
      setDetail(updated);
      setSelectedStep(updated.processStep || '');
      message.success('Jarayon holati yangilandi');
      onUpdated?.(updated);
    } catch (error) {
      message.error(error?.message || 'Holatni yangilab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlobalModal
      open={open}
      title={detail?.requestCode || 'Logistica yuk'}
      onClose={() => {
        if (!saving) onClose?.();
      }}
    >
      {loading || !detail ? (
        <div className="logistica-shipment-detail-modal__loading">
          <Spin />
        </div>
      ) : (
        <div className="logistica-shipment-detail-modal">
          <div className="logistica-shipment-detail-modal__meta">
            <div>
              <span>Siller</span>
              <strong>{detail.sellerName}</strong>
            </div>
            <div>
              <span>Davlat</span>
              <strong>{detail.sellerCountryLabel || detail.sellerCountry}</strong>
            </div>
            <div>
              <span>Logistica</span>
              <strong>{detail.logisticaCompanyName || '—'}</strong>
            </div>
            <div>
              <span>Qabul</span>
              <strong>{formatDateTime(detail.acceptedAt)}</strong>
            </div>
          </div>

          <div className="logistica-shipment-detail-modal__timeline">
            <h4>Jarayon holati</h4>
            <ul>
              {(detail.timeline || []).map((step) => (
                <li
                  key={step.key}
                  className={
                    step.done
                      ? 'logistica-shipment-detail-modal__step--done'
                      : ''
                  }
                >
                  <span className="logistica-shipment-detail-modal__dot" />
                  <div>
                    <strong>{step.label}</strong>
                    {step.at ? (
                      <small>{formatDateTime(step.at)}</small>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="logistica-shipment-detail-modal__edit">
            <h4>Holatni o‘zgartirish</h4>
            <div className="logistica-shipment-detail-modal__steps">
              {(detail.processSteps || []).map((step) => (
                <button
                  key={step.key}
                  type="button"
                  className={`logistica-shipment-detail-modal__step-btn${
                    selectedStep === step.key
                      ? ' logistica-shipment-detail-modal__step-btn--active'
                      : ''
                  }`}
                  disabled={saving}
                  onClick={() => setSelectedStep(step.key)}
                >
                  {step.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="logistica-shipment-detail-modal__confirm"
              disabled={saving || !selectedStep}
              onClick={handleConfirm}
            >
              {saving ? 'Saqlanmoqda...' : 'Tasdiqlash'}
            </button>
          </div>
        </div>
      )}
    </GlobalModal>
  );
}
