import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import GlobalModal from '../GlobalModal/GlobalModal';
import {
  fetchLogisticaDetail,
  fetchLogisticaDetailHistory,
} from '../../api/logisticaAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import {
  formatCargoServiceTypeLabel,
  isKnownCargoServiceType,
} from '../../utils/cargoServiceRules';
import './LogisticaDetailModal.css';

const FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'handed_over', label: 'Topshirildi' },
  { key: 'returned', label: 'Qaytarildi' },
];

const PAGE_SIZE = 20;

function formatMoney(value) {
  return `${Math.max(0, Number(value) || 0).toLocaleString('uz-UZ')} so‘m`;
}

function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ');
}

function customerLabel(customer) {
  if (!customer) return '—';
  const name = String(customer.fullName || '').trim();
  const phone = String(customer.phone || '').trim();
  if (name && name !== '—' && phone) return `${name} · ${phone}`;
  if (name && name !== '—') return name;
  if (phone) return phone;
  return '—';
}

export default function LogisticaDetailModal({
  open = false,
  logisticaId = '',
  onClose,
}) {
  const { showToast } = useAdminToast();
  const [kind, setKind] = useState('all');
  const [detail, setDetail] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const detailRequestIdRef = useRef(0);
  const historyRequestIdRef = useRef(0);

  const loadDetail = useCallback(async () => {
    if (!logisticaId) return;
    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;
    setLoading(true);
    setError('');
    try {
      const data = await fetchLogisticaDetail(logisticaId);
      if (detailRequestIdRef.current !== requestId) return;
      setDetail(data);
    } catch (err) {
      if (detailRequestIdRef.current !== requestId) return;
      setDetail(null);
      setError(err.message || 'Ma’lumot yuklanmadi');
      showToast({
        type: 'error',
        message: err.message || 'Ma’lumot yuklanmadi',
      });
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [logisticaId, showToast]);

  const loadHistory = useCallback(
    async (nextKind = 'all', nextPage = 1, append = false) => {
      if (!logisticaId) return;
      const requestId = historyRequestIdRef.current + 1;
      historyRequestIdRef.current = requestId;
      if (append) setLoadingMore(true);
      else setHistoryLoading(true);

      try {
        const data = await fetchLogisticaDetailHistory(logisticaId, {
          kind: nextKind,
          page: nextPage,
          limit: PAGE_SIZE,
        });
        if (historyRequestIdRef.current !== requestId) return;
        setItems((prev) =>
          append ? [...prev, ...(data.items || [])] : data.items || [],
        );
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (historyRequestIdRef.current !== requestId) return;
        if (!append) setItems([]);
        showToast({
          type: 'error',
          message: err.message || 'Tarix yuklanmadi',
        });
      } finally {
        if (historyRequestIdRef.current === requestId) {
          setHistoryLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [logisticaId, showToast],
  );

  useEffect(() => {
    if (!open || !logisticaId) {
      detailRequestIdRef.current += 1;
      historyRequestIdRef.current += 1;
      setDetail(null);
      setItems([]);
      setKind('all');
      setPage(1);
      setTotalPages(1);
      setLoading(false);
      setHistoryLoading(false);
      setLoadingMore(false);
      setError('');
      return undefined;
    }

    setKind('all');
    loadDetail();
    loadHistory('all', 1, false);
    return undefined;
  }, [open, logisticaId, loadDetail, loadHistory]);

  const handleFilter = (nextKind) => {
    if (nextKind === kind) return;
    setKind(nextKind);
    loadHistory(nextKind, 1, false);
  };

  const profile = detail?.profile;
  const balance = detail?.balance;
  const title =
    profile?.companyName || profile?.name || profile?.email || "Logistica ma'lumoti";

  return (
    <GlobalModal open={open} title={title} onClose={onClose} wide>
      {loading ? (
        <div className="logistica-detail-modal__loading">
          <Spin />
        </div>
      ) : error && !detail ? (
        <p className="logistica-detail-modal__error">{error}</p>
      ) : (
        <div className="logistica-detail-modal">
          <section className="logistica-detail-modal__profile">
            <div className="logistica-detail-modal__field">
              <span className="logistica-detail-modal__label">Kompaniya</span>
              <p className="logistica-detail-modal__value">
                {profile?.companyName || '—'}
              </p>
            </div>
            <div className="logistica-detail-modal__field">
              <span className="logistica-detail-modal__label">Gmail</span>
              <p className="logistica-detail-modal__value">
                {profile?.email || '—'}
              </p>
            </div>
            <div className="logistica-detail-modal__field">
              <span className="logistica-detail-modal__label">Davlat</span>
              <p className="logistica-detail-modal__value">
                {profile?.countryLabel || profile?.logisticaCountry || '—'}
              </p>
            </div>
            <div className="logistica-detail-modal__field">
              <span className="logistica-detail-modal__label">Telefon</span>
              <p className="logistica-detail-modal__value">
                {profile?.chinaPhone || '—'}
              </p>
            </div>
            <div className="logistica-detail-modal__field logistica-detail-modal__field--full">
              <span className="logistica-detail-modal__label">Manzil</span>
              <p className="logistica-detail-modal__value">
                {profile?.chinaAddress || '—'}
              </p>
            </div>
            {profile?.profileDescription ? (
              <div className="logistica-detail-modal__field logistica-detail-modal__field--full">
                <span className="logistica-detail-modal__label">Tavsif</span>
                <p className="logistica-detail-modal__value">
                  {profile.profileDescription}
                </p>
              </div>
            ) : null}
          </section>

          <h3 className="logistica-detail-modal__section-title">Balans</h3>
          <div className="logistica-detail-modal__balance-row">
            <div className="logistica-detail-modal__balance-card logistica-detail-modal__balance-card--week">
              <p className="logistica-detail-modal__balance-label">Haftalik</p>
              <p className="logistica-detail-modal__balance-amount">
                {formatMoney(balance?.week?.balance)}
              </p>
              <p className="logistica-detail-modal__balance-period">
                {balance?.week?.periodLabel || 'Joriy hafta'}
              </p>
            </div>
            <div className="logistica-detail-modal__balance-card logistica-detail-modal__balance-card--month">
              <p className="logistica-detail-modal__balance-label">Oylik</p>
              <p className="logistica-detail-modal__balance-amount">
                {formatMoney(balance?.month?.balance)}
              </p>
              <p className="logistica-detail-modal__balance-period">
                {balance?.month?.periodLabel || 'Joriy oy'}
              </p>
            </div>
          </div>

          <h3 className="logistica-detail-modal__section-title">Tarix</h3>
          <div className="logistica-detail-modal__filters" role="tablist">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                role="tab"
                aria-selected={kind === filter.key}
                className={`logistica-detail-modal__filter${
                  kind === filter.key
                    ? ' logistica-detail-modal__filter--active'
                    : ''
                }`}
                onClick={() => handleFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {historyLoading ? (
            <div className="logistica-detail-modal__loading">
              <Spin />
            </div>
          ) : items.length === 0 ? (
            <p className="logistica-detail-modal__empty">
              Bu filtr bo‘yicha yozuv yo‘q
            </p>
          ) : (
            <div className="logistica-detail-modal__list">
              {items.map((item) => {
                const isReturned = item.kind === 'returned';
                return (
                  <article key={item.id} className="logistica-detail-modal__card">
                    <div className="logistica-detail-modal__card-top">
                      <p className="logistica-detail-modal__code">
                        {item.requestCode || item.productCode || '—'}
                      </p>
                      <div className="logistica-detail-modal__badges">
                        {isKnownCargoServiceType(item.cargoServiceType) ? (
                          <span className="logistica-detail-modal__badge logistica-detail-modal__badge--lane">
                            {formatCargoServiceTypeLabel(item.cargoServiceType)}
                          </span>
                        ) : null}
                        <span
                          className={`logistica-detail-modal__badge ${
                            isReturned
                              ? 'logistica-detail-modal__badge--returned'
                              : 'logistica-detail-modal__badge--handed'
                          }`}
                        >
                          {isReturned ? 'Qaytarildi' : 'Topshirildi'}
                        </span>
                      </div>
                    </div>
                    <p className="logistica-detail-modal__title">
                      {item.productTitle || 'Mahsulot'}
                    </p>
                    <p className="logistica-detail-modal__meta">
                      Siller: {item.storeName || item.sellerId || '—'} · #
                      {item.orderId || 0}
                    </p>
                    <p className="logistica-detail-modal__meta">
                      Mijoz: {customerLabel(item.customer)}
                    </p>
                    <p className="logistica-detail-modal__meta">
                      {formatWhen(item.at)}
                    </p>
                    {item.amount > 0 ? (
                      <p className="logistica-detail-modal__amount">
                        {formatMoney(item.amount)}
                      </p>
                    ) : null}
                  </article>
                );
              })}

              {page < totalPages ? (
                <button
                  type="button"
                  className="logistica-detail-modal__more"
                  disabled={loadingMore}
                  onClick={() => loadHistory(kind, page + 1, true)}
                >
                  {loadingMore ? 'Yuklanmoqda...' : 'Yana ko‘rsatish'}
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}
    </GlobalModal>
  );
}
