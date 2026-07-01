import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SkeletonPulse } from '../SkeletonLoader';
import { getLocalizedText, normalizeImagePath } from '../../utils/utils';
import '../SellerProfileReyting/SellerProfileReyting.css';
import './ChatsPageSearchResultat.css';

const FALLBACK_AVATAR = '/img/no-image.png';

function formatRatingAverage(value) {
  const rating = Number(value);
  return Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : '--';
}

function normalizeSellerItem(item, langKey) {
  if (!item || typeof item !== 'object') return null;

  return {
    id: String(item.id ?? item.sellerId ?? ''),
    name: getLocalizedText(item.name, langKey) || item.name || 'Seller',
    logo: item.logo || FALLBACK_AVATAR,
    productCount: Math.max(0, Number(item.productCount) || 0),
    averageRating: Number(item.averageRating) || 0,
  };
}

function ChatsPageSearchResultatSkeleton({ count = 4 }) {
  return (
    <div className="chats-page-search-resultat chats-page-search-resultat--skeleton" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`chats-seller-search-sk-${index}`} className="chats-page-search-resultat__item">
          <SkeletonPulse className="chats-page-search-resultat__avatar chats-page-search-resultat__avatar--skeleton" />
          <div className="chats-page-search-resultat__meta">
            <SkeletonPulse className="chats-page-search-resultat__name chats-page-search-resultat__name--skeleton" />
            <SkeletonPulse className="chats-page-search-resultat__stats chats-page-search-resultat__stats--skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChatsPageSearchResultat({
  sellers = [],
  loading = false,
  langKey = 'uz',
  onSellerClick,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const normalized = (Array.isArray(sellers) ? sellers : [])
    .map((item) => normalizeSellerItem(item, langKey))
    .filter((item) => item?.id);

  if (loading) {
    return <ChatsPageSearchResultatSkeleton />;
  }

  if (!normalized.length) {
    return null;
  }

  const handleOpenSeller = (sellerId) => {
    onSellerClick?.(sellerId);
    navigate(`/seller/${sellerId}`);
  };

  return (
    <div className="chats-page-search-resultat">
      {normalized.map((seller) => (
        <button
          key={seller.id}
          type="button"
          className="chats-page-search-resultat__item"
          onClick={() => handleOpenSeller(seller.id)}
        >
          <img
            src={normalizeImagePath(seller.logo || FALLBACK_AVATAR)}
            alt={seller.name}
            className="chats-page-search-resultat__avatar"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = normalizeImagePath(FALLBACK_AVATAR);
            }}
          />

          <div className="chats-page-search-resultat__meta">
            <p className="chats-page-search-resultat__name">{seller.name}</p>
            <div className="chats-page-search-resultat__stats">
              <span className="chats-page-search-resultat__products">
                {t('seller.productCount', { count: seller.productCount })}
              </span>
              <span className="seller-rating__average chats-page-search-resultat__rating">
                {formatRatingAverage(seller.averageRating)}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
