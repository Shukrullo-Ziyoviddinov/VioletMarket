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

function parseKg(raw) {
  return Number(String(raw || '').replace(',', '.').trim());
}

/** Logistica kabi: har shipment (mahsulot) uchun alohida kg qatori */
function buildArrivalWeightItems(detail) {
  const products = Array.isArray(detail?.products) ? detail.products : [];
  const byShip = new Map();
  for (const product of products) {
    const shipmentId = String(product.shipmentId || detail?.id || '').trim();
    if (!shipmentId) continue;
    const title = String(product.title || '').trim() || shipmentId;
    const existing = byShip.get(shipmentId);
    if (!existing) {
      byShip.set(shipmentId, {
        shipmentId,
        label: title,
        initialWeightKg: Math.max(0, Number(product.weightKg) || 0),
      });
    } else {
      existing.label = `${existing.label}; ${title}`;
      existing.initialWeightKg += Math.max(0, Number(product.weightKg) || 0);
    }
  }
  if (!byShip.size && detail?.id) {
    byShip.set(String(detail.id), {
      shipmentId: String(detail.id),
      label: String(detail.productTitle || 'Mahsulot'),
      initialWeightKg: Math.max(0, Number(detail.weightKg) || 0),
    });
  }
  return [...byShip.values()];
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
  const [weightByShipment, setWeightByShipment] = useState({});
  const [feeText, setFeeText] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open || !shipmentId) {
      setDetail(null);
      setSelectedStep('');
      setArrivalOpen(false);
      setPaidConfirmOpen(false);
      setWeightByShipment({});
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
  const canMarkPaid = Boolean(detail?.canMarkPaid);

  const processSteps = useMemo(
    () => (Array.isArray(detail?.processSteps) ? detail.processSteps : []),
    [detail],
  );

  const arrivalWeightItems = useMemo(
    () => buildArrivalWeightItems(detail),
    [detail],
  );
  const isArrivalGroup = arrivalWeightItems.length > 1;
  const arrivalTotalKg = useMemo(() => {
    return arrivalWeightItems.reduce((sum, item) => {
      const kg = parseKg(weightByShipment[item.shipmentId]);
      return sum + (Number.isFinite(kg) && kg > 0 ? kg : 0);
    }, 0);
  }, [arrivalWeightItems, weightByShipment]);

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
    const next = {};
    for (const item of buildArrivalWeightItems(detail)) {
      next[item.shipmentId] =
        item.initialWeightKg > 0 ? String(item.initialWeightKg) : '';
    }
    setWeightByShipment(next);
    setFeeText(
      detail?.cargoDeliveryFee > 0 ? String(detail.cargoDeliveryFee) : '',
    );
    setComment(detail?.uzArrivalComment || '');
    setArrivalOpen(true);
  };

  const handleArrive = async () => {
    if (!detail?.id || saving) return;

    const itemWeights = [];
    for (const item of arrivalWeightItems) {
      const kg = parseKg(weightByShipment[item.shipmentId]);
      if (!Number.isFinite(kg) || kg <= 0) {
        message.error(
          isArrivalGroup
            ? `«${item.label}» uchun og‘irlikni to‘g‘ri kiriting`
            : 'Og‘irlikni to‘g‘ri kiriting (kg)',
        );
        return;
      }
      itemWeights.push({
        shipmentId: item.shipmentId,
        weightKg: Math.round(kg * 1000) / 1000,
      });
    }

    const weightKg = Math.round(arrivalTotalKg * 1000) / 1000;
    if (!(weightKg > 0)) {
      message.error('Og‘irlikni to‘g‘ri kiriting (kg)');
      return;
    }

    const cargoDeliveryFee = Number(
      String(feeText).replace(/\s/g, '').replace(',', '.'),
    );
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
        // Guruhda majburiy; bitta mahsulotda ham xavfsiz
        itemWeights,
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
              {detail.isGroup ? (
                <div>
                  <span>Guruh</span>
                  <strong>
                    {detail.productCount || detail.siblingIds?.length || 0} ta
                    mahsulot
                  </strong>
                </div>
              ) : null}
            </div>

            {Array.isArray(detail.products) && detail.products.length > 0 ? (
              <div className="logistica-shipment-detail-modal__products">
                <h4>Mahsulotlar</h4>
                <ul>
                  {detail.products.map((product) => (
                    <li key={product.id}>
                      <strong>{product.title || '—'}</strong>
                      <span>
                        {Number(product.weightKg) > 0
                          ? `${product.weightKg} kg`
                          : ''}
                        {product.quantity > 1 ? ` ×${product.quantity}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                {detail.isGroup || detail.products.length > 1 ? (
                  <p className="logistica-shipment-detail-modal__total-weight">
                    Umumiy: {detail.weightKg} kg
                  </p>
                ) : null}
              </div>
            ) : null}

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
                    {isToshkent
                      ? 'Avval «Cargo to‘lovlari» da mijoz to‘lovini tasdiqlang.'
                      : 'Avval «Clientga yuborish» orqali Toshkentga o‘ting.'}
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
          {isArrivalGroup ? (
            <p className="logistica-shipment-detail-modal__arrival-hint">
              Har bir mahsulot og‘irligini alohida kiriting. Umumiy kg
              avtomatik. Narx bitta — mijoz bir marta to‘laydi.
            </p>
          ) : null}

          {arrivalWeightItems.map((item) => (
            <label key={item.shipmentId}>
              {isArrivalGroup
                ? `${item.label} — og‘irlik (kg)`
                : 'Og‘irlik (kg)'}
              <input
                type="text"
                inputMode="decimal"
                value={weightByShipment[item.shipmentId] || ''}
                disabled={saving}
                onChange={(e) => {
                  const value = e.target.value;
                  setWeightByShipment((prev) => ({
                    ...prev,
                    [item.shipmentId]: value,
                  }));
                }}
                placeholder="masalan: 2.5"
              />
            </label>
          ))}

          <div className="logistica-shipment-detail-modal__arrival-total">
            <span>Umumiy og‘irlik</span>
            <strong>
              {Math.round(arrivalTotalKg * 1000) / 1000 || 0} kg
            </strong>
          </div>

          <label>
            Og‘irlik summasi (so‘m)
            {isArrivalGroup ? ' — bitta to‘lov' : ''}
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
