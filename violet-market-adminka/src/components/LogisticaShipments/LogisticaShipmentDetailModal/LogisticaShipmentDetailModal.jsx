import React, { useEffect, useMemo, useState } from 'react';
import { message, Spin } from 'antd';
import GlobalModal from '../../GlobalModal/GlobalModal';
import MiniGlobalModal from '../../MiniGlobalModal/MiniGlobalModal';
import {
  arriveAdminCargoShipmentUzWarehouse,
  fetchAdminCargoShipmentDetail,
  markAdminCargoShipmentPaid,
  updateAdminCargoShipmentProcessStep,
} from '../../../api/adminCargoShipmentsApi';
import './LogisticaShipmentDetailModal.css';

const UZ_FLOW_STEPS = new Set(['bojxonada', 'toshkent_omborida']);

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

function formatMoney(value) {
  const n = Number(value) || 0;
  return `${n.toLocaleString('uz-UZ')} so‘m`;
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
  const [arrivalOpen, setArrivalOpen] = useState(false);
  const [paidConfirmOpen, setPaidConfirmOpen] = useState(false);
  const [weightText, setWeightText] = useState('');
  const [feeText, setFeeText] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open || !shipmentId) {
      setDetail(null);
      setSelectedStep('');
      setArrivalOpen(false);
      setPaidConfirmOpen(false);
      setWeightText('');
      setFeeText('');
      setComment('');
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

  const step = String(detail?.processStep || '');
  const isPaid = Boolean(detail?.paidAt);
  const isUzFlow = UZ_FLOW_STEPS.has(step);
  const isBojxonada = step === 'bojxonada';
  const isToshkent = step === 'toshkent_omborida' && Boolean(detail?.uzArrivedAt);
  const showYuklarimEdit = Boolean(detail) && !isUzFlow && !isPaid;
  const showUzArrivalAction = Boolean(detail) && isBojxonada && !isPaid;
  const showPaidAction = Boolean(detail) && isUzFlow && !isPaid;
  const canMarkPaid = isToshkent && !isPaid;

  const processSteps = useMemo(
    () => (Array.isArray(detail?.processSteps) ? detail.processSteps : []),
    [detail],
  );

  const applyDetail = (updated) => {
    setDetail(updated);
    setSelectedStep(updated.processStep || '');
  };

  const handleConfirmStep = async () => {
    if (!detail?.id || !selectedStep || saving || !showYuklarimEdit) return;
    if (selectedStep === 'toshkent_omborida') {
      message.info('Toshkent uchun «Clientga yuborish» ni ishlating');
      return;
    }
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
      applyDetail(updated);
      message.success('Jarayon holati yangilandi');
      onUpdated?.(updated);
    } catch (error) {
      message.error(error?.message || 'Holatni yangilab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  };

  const openArrivalModal = () => {
    setWeightText(detail?.weightKg > 0 ? String(detail.weightKg) : '');
    setFeeText(
      detail?.cargoDeliveryFee > 0 ? String(detail.cargoDeliveryFee) : '',
    );
    setComment(detail?.uzArrivalComment || '');
    setArrivalOpen(true);
  };

  const handleArrive = async () => {
    if (!detail?.id || saving) return;
    const weightKg = Number(String(weightText).replace(',', '.'));
    const cargoDeliveryFee = Number(
      String(feeText).replace(/\s/g, '').replace(',', '.'),
    );

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      message.error('Og‘irlikni to‘g‘ri kiriting (kg)');
      return;
    }
    if (!Number.isFinite(cargoDeliveryFee) || cargoDeliveryFee < 0) {
      message.error('Og‘irlik summasini to‘g‘ri kiriting');
      return;
    }

    setSaving(true);
    try {
      const result = await arriveAdminCargoShipmentUzWarehouse(detail.id, {
        weightKg,
        cargoDeliveryFee,
        comment: comment.trim(),
      });
      applyDetail(result.shipment);
      setArrivalOpen(false);
      message.success(
        result.alreadyArrived
          ? 'Allaqachon belgilangan'
          : 'Toshkent omborida. Endi «To‘landi» ni bosing.',
      );
      onUpdated?.(result.shipment);
    } catch (error) {
      message.error(error?.message || 'Yuborib bo‘lmadi');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!detail?.id || saving || !canMarkPaid) return;
    setSaving(true);
    try {
      const result = await markAdminCargoShipmentPaid(detail.id);
      setPaidConfirmOpen(false);
      message.success(
        result.alreadyPaid
          ? 'Allaqachon to‘langan'
          : 'To‘landi — Xorij→UZB ro‘yxatiga chiqadi',
      );
      onUpdated?.(result.shipment);
      onClose?.();
    } catch (error) {
      message.error(error?.message || 'Belgilab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
                <strong>
                  {detail.sellerCountryLabel || detail.sellerCountry}
                </strong>
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
                {(detail.timeline || []).map((item) => (
                  <li
                    key={item.key}
                    className={
                      item.done
                        ? 'logistica-shipment-detail-modal__step--done'
                        : ''
                    }
                  >
                    <span className="logistica-shipment-detail-modal__dot" />
                    <div>
                      <strong>{item.label}</strong>
                      {item.at ? (
                        <small>{formatDateTime(item.at)}</small>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {isToshkent ? (
              <div className="logistica-shipment-detail-modal__arrival">
                <h4>Toshkent omborida</h4>
                <p>Og‘irlik: {detail.weightKg} kg</p>
                <p>Summa: {formatMoney(detail.cargoDeliveryFee)}</p>
                {detail.uzArrivalComment ? (
                  <p>Izoh: {detail.uzArrivalComment}</p>
                ) : null}
              </div>
            ) : null}

            {showYuklarimEdit ? (
              <div className="logistica-shipment-detail-modal__edit">
                <h4>Holatni o‘zgartirish</h4>
                <div className="logistica-shipment-detail-modal__steps">
                  {processSteps.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`logistica-shipment-detail-modal__step-btn${
                        selectedStep === item.key
                          ? ' logistica-shipment-detail-modal__step-btn--active'
                          : ''
                      }`}
                      disabled={saving}
                      onClick={() => setSelectedStep(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="logistica-shipment-detail-modal__confirm"
                  disabled={saving || !selectedStep}
                  onClick={handleConfirmStep}
                >
                  {saving ? 'Saqlanmoqda...' : 'Tasdiqlash'}
                </button>
              </div>
            ) : null}

            {showUzArrivalAction ? (
              <div className="logistica-shipment-detail-modal__edit">
                <h4>Toshkent omboriga</h4>
                <p className="logistica-shipment-detail-modal__hint">
                  Og‘irlik va summani kiriting — holat «Toshkent omborida»
                  bo‘ladi.
                </p>
                <button
                  type="button"
                  className="logistica-shipment-detail-modal__confirm"
                  disabled={saving}
                  onClick={openArrivalModal}
                >
                  Clientga yuborish
                </button>
              </div>
            ) : null}

            {showPaidAction ? (
              <div className="logistica-shipment-detail-modal__edit">
                {!showYuklarimEdit ? (
                  <button
                    type="button"
                    className="logistica-shipment-detail-modal__confirm logistica-shipment-detail-modal__confirm--muted"
                    disabled
                  >
                    Tasdiqlash
                  </button>
                ) : null}
                <button
                  type="button"
                  className="logistica-shipment-detail-modal__paid"
                  disabled={saving || !canMarkPaid}
                  onClick={() => {
                    if (canMarkPaid) setPaidConfirmOpen(true);
                  }}
                >
                  To‘landi
                </button>
                {!canMarkPaid ? (
                  <p className="logistica-shipment-detail-modal__hint">
                    Avval «Clientga yuborish» orqali Toshkentga o‘ting.
                  </p>
                ) : null}
              </div>
            ) : null}

            {isPaid ? (
              <p className="logistica-shipment-detail-modal__hint">
                To‘lov belgilangan — Xorij→UZB da ko‘rinadi.
              </p>
            ) : null}
          </div>
        )}
      </GlobalModal>

      <GlobalModal
        open={arrivalOpen}
        title="Toshkent omboriga qabul"
        onClose={() => {
          if (!saving) setArrivalOpen(false);
        }}
      >
        <div className="logistica-shipment-detail-modal__arrival-form">
          <label>
            Og‘irlik (kg)
            <input
              type="text"
              inputMode="decimal"
              value={weightText}
              disabled={saving}
              onChange={(e) => setWeightText(e.target.value)}
              placeholder="masalan: 2.5"
            />
          </label>
          <label>
            Og‘irlik summasi (so‘m)
            <input
              type="text"
              inputMode="numeric"
              value={feeText}
              disabled={saving}
              onChange={(e) => setFeeText(e.target.value)}
              placeholder="masalan: 45000"
            />
          </label>
          <label>
            Izoh (ixtiyoriy)
            <textarea
              rows={3}
              value={comment}
              disabled={saving}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Qisqa izoh"
            />
          </label>
          <button
            type="button"
            className="logistica-shipment-detail-modal__confirm"
            disabled={saving}
            onClick={handleArrive}
          >
            {saving ? 'Yuborilmoqda...' : 'Clientga yuborish'}
          </button>
        </div>
      </GlobalModal>

      <MiniGlobalModal
        open={paidConfirmOpen}
        mode="confirm"
        permissionKey="cargoMarkPaid"
        itemName={detail?.requestCode || detail?.productTitle || ''}
        loading={saving}
        onConfirm={handleMarkPaid}
        onCancel={() => {
          if (!saving) setPaidConfirmOpen(false);
        }}
      />
    </>
  );
}
