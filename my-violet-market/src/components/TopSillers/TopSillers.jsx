import React from 'react';
import { useTranslation } from 'react-i18next';
import Scrollable from '../Scrollable/Scrollable';
import SellerOrderCount from '../SellerOrderCount/SellerOrderCount';
import SellerSubscriberCount from '../SellerSubscriberCount/SellerSubscriberCount';
import { getLocalizedText, normalizeImagePath } from '../../utils/utils';
import './TopSillers.css';

const FALLBACK_AVATAR = '/img/no-image.png';

function normalizeTopSeller(rawItem, index = 0, lang = 'uz') {
  if (!rawItem || typeof rawItem !== 'object') return null;

  const ratingRaw = Number(rawItem.averageRating);
  const averageRating = Number.isFinite(ratingRaw) && ratingRaw > 0
    ? Math.min(5, ratingRaw)
    : Number((4.9 - index * 0.2).toFixed(1));

  return {
    id: String(rawItem.id ?? rawItem.sellerId ?? `top-siller-${index}`),
    name: getLocalizedText(rawItem.name, lang) || rawItem.name || `Seller ${index + 1}`,
    logo: rawItem.logo || FALLBACK_AVATAR,
    orderCount: Math.max(0, Number(rawItem.orderCount) || 0),
    subscriberCount: Math.max(0, Number(rawItem.subscriberCount) || 0),
    averageRating,
  };
}

export default function TopSillers({ sellers = [] }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'uz').toLowerCase().startsWith('ru') ? 'ru' : 'uz';

  const normalized = (Array.isArray(sellers) ? sellers : [])
    .map((item, index) => normalizeTopSeller(item, index, lang))
    .filter(Boolean)
    .slice(0, 8);

  if (!normalized.length) return null;

  return (
    <section className="top-sillers" aria-label={t('home.topSillersTitle')}>
      <h2 className="top-sillers__title">{t('home.topSillersTitle')}</h2>

      <Scrollable type="product" className="top-sillers-scrollable" skipInteractiveTouchHandling>
        {normalized.map((seller) => (
          <div key={seller.id} className="top-sillers__item-wrap">
            <article className="top-sillers__item">
              <div className="top-sillers__head">
                <img
                  src={normalizeImagePath(seller.logo || FALLBACK_AVATAR)}
                  alt={seller.name}
                  className="top-sillers__avatar"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = normalizeImagePath(FALLBACK_AVATAR);
                  }}
                />

                <div className="top-sillers__meta">
                  <p className="top-sillers__name">{seller.name}</p>
                  <div className="top-sillers__stats">
                    <SellerOrderCount count={seller.orderCount} />
                    <SellerSubscriberCount count={seller.subscriberCount} />
                    <p className="seller-profile__rating-preview">
                      <i className="bx bxs-star" aria-hidden="true" />
                      <span>{seller.averageRating.toFixed(1)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="top-sillers__actions">
                <button type="button" className="top-sillers__action-btn">
                  <i className="bx bx-chat" aria-hidden="true" />
                  <span>{t('home.topSillersChat')}</span>
                </button>
                <button type="button" className="top-sillers__action-btn">
                  <i className="bx bx-store" aria-hidden="true" />
                  <span>{t('home.topSillersShop')}</span>
                </button>
              </div>
            </article>
          </div>
        ))}
      </Scrollable>
    </section>
  );
}
