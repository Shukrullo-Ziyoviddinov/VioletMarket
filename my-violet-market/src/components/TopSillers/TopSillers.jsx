import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Scrollable from '../Scrollable/Scrollable';
import SellerOrderCount from '../SellerOrderCount/SellerOrderCount';
import SellerSubscriberCount from '../SellerSubscriberCount/SellerSubscriberCount';
import ProductSellerChatModal from '../ProductSellerChatModal';
import { useAppData } from '../../contexts/AppDataContext';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { useSellerMessageChat } from '../../hooks/useSellerMessageChat';
import { useMessageChatTyping } from '../../hooks/useMessageChatTyping';
import { useMessageChatSending } from '../../hooks/useMessageChatSending';
import { useMessageChatPresence } from '../../hooks/useMessageChatPresence';
import { getLocalizedText, normalizeImagePath } from '../../utils/utils';
import TopSillersSkeleton from './TopSillersSkeleton';
import './TopSillers.css';

const FALLBACK_AVATAR = '/img/no-image.png';
const PUBLIC_ASSET_BASE = process.env.PUBLIC_URL || '';

const TOP_SILLER_RANK_MEDALS = {
  1: `${PUBLIC_ASSET_BASE}/img/1o'rinsiller.png`,
  2: `${PUBLIC_ASSET_BASE}/img/2o'rinsiller.png`,
  3: `${PUBLIC_ASSET_BASE}/img/3o'rinsiller.png`,
};

function TopSellerRankBadge({ rank }) {
  const safeRank = Number(rank);
  if (!Number.isFinite(safeRank) || safeRank < 1) return null;

  if (safeRank <= 3) {
    const medalSrc = TOP_SILLER_RANK_MEDALS[safeRank];
    if (!medalSrc) return null;

    return (
      <div className="top-sillers__rank" aria-hidden="true">
        <img
          src={medalSrc}
          alt=""
          className="top-sillers__rank-medal"
          loading="lazy"
        />
      </div>
    );
  }

  if (safeRank <= 10) {
    return (
      <div className="top-sillers__rank" aria-hidden="true">
        <span className="top-sillers__rank-number">{safeRank}</span>
      </div>
    );
  }

  return null;
}

function formatRatingPreview(averageRating) {
  const value = Number(averageRating);
  return Number.isFinite(value) ? value.toFixed(1) : '--';
}

function normalizeTopSeller(rawItem, lang = 'uz') {
  if (!rawItem || typeof rawItem !== 'object') return null;

  const averageRating = Number.isFinite(Number(rawItem.averageRating))
    ? Number(Number(rawItem.averageRating).toFixed(1))
    : 0;

  return {
    id: String(rawItem.id ?? rawItem.sellerId ?? ''),
    name: getLocalizedText(rawItem.name, lang) || rawItem.name || 'Seller',
    rawName: rawItem.name,
    logo: rawItem.logo || FALLBACK_AVATAR,
    orderCount: Math.max(0, Number(rawItem.orderCount) || 0),
    subscriberCount: Math.max(0, Number(rawItem.subscriberCount) || 0),
    averageRating,
    ratingPreview: formatRatingPreview(averageRating),
    rank: Number(rawItem.rank) > 0 ? Number(rawItem.rank) : null,
  };
}

export default function TopSillers({
  sellers = [],
  isLoading = false,
  variant = 'default',
  onOpenChat: onOpenChatExternal,
  hideChatModal = false,
}) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { getSellerById } = useAppData();
  const { userData, authToken } = useUser();
  const { showToast } = useToast();
  const lang = i18n.language || 'uz';
  const langKey = lang.toLowerCase().startsWith('ru') ? 'ru' : 'uz';

  const [activeChatSellerId, setActiveChatSellerId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const normalized = useMemo(
    () =>
      (Array.isArray(sellers) ? sellers : [])
        .map((item) => normalizeTopSeller(item, langKey))
        .filter((item) => item?.id),
    [sellers, langKey],
  );

  const activeChatSeller = useMemo(() => {
    if (!activeChatSellerId) return null;
    const fromCatalog = getSellerById(activeChatSellerId);
    if (fromCatalog) return fromCatalog;

    const item = normalized.find((seller) => seller.id === String(activeChatSellerId));
    if (!item) return null;

    return {
      id: item.id,
      name: item.rawName || item.name,
      logo: item.logo,
    };
  }, [activeChatSellerId, getSellerById, normalized]);

  const {
    messages: chatMessages,
    loading: isChatLoading,
    isSending: isChatSending,
    sendText: sendChatText,
    sendImage: sendChatImage,
    sendProduct: sendChatProduct,
    deleteMessage: deleteChatMessage,
    editMessage: editChatMessage,
    deleteThread: deleteChatThread,
  } = useSellerMessageChat({
    authToken,
    sellerId: activeChatSellerId,
    enabled: isChatOpen && Boolean(authToken),
  });

  const {
    isPartnerTyping: isSellerTyping,
    handleComposerActivity: handleChatComposerActivity,
    stopTyping: stopChatTyping,
  } = useMessageChatTyping({
    sellerId: activeChatSellerId,
    enabled: isChatOpen && Boolean(authToken),
    watchSender: 'seller',
  });

  const { isPartnerSending: isSellerPartnerSending } = useMessageChatSending({
    sellerId: activeChatSellerId,
    enabled: isChatOpen && Boolean(authToken),
    watchSender: 'seller',
  });

  const { isPartnerOnline: isSellerOnline, partnerLastActiveAt: sellerLastActiveAt } =
    useMessageChatPresence({
      sellerId: activeChatSellerId,
      enabled: isChatOpen && Boolean(authToken),
      watchKind: 'seller',
    });

  const handleOpenChat = useCallback(
    (sellerId, event) => {
      event?.stopPropagation?.();
      event?.preventDefault?.();

      if (onOpenChatExternal) {
        onOpenChatExternal(sellerId, event);
        return;
      }

      if (!userData?.isAuthenticated || !authToken) {
        showToast(t('profile.messagesLoginRequired'), 'info');
        navigate('/login');
        return;
      }

      setActiveChatSellerId(sellerId);
      setIsChatOpen(true);
    },
    [authToken, navigate, onOpenChatExternal, showToast, t, userData?.isAuthenticated],
  );

  const handleOpenShop = useCallback(
    (sellerId, event) => {
      event?.stopPropagation?.();
      event?.preventDefault?.();
      navigate(`/seller/${sellerId}`);
    },
    [navigate],
  );

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
    setActiveChatSellerId(null);
  }, []);

  if (!isLoading && !normalized.length) return null;

  const sectionClassName = [
    'top-sillers',
    variant === 'embedded' ? 'top-sillers--embedded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <section
        className={sectionClassName}
        aria-label={t('home.topSillersTitle')}
        aria-busy={isLoading}
      >
        <h2 className="top-sillers__title">{t('home.topSillersTitle')}</h2>

        {isLoading ? (
          <TopSillersSkeleton count={4} />
        ) : (
          <Scrollable type="product" className="top-sillers-scrollable" skipInteractiveTouchHandling>
          {normalized.map((seller, index) => {
            const rank = seller.rank ?? index + 1;

            return (
            <div key={seller.id} className="top-sillers__item-wrap">
              <article className="top-sillers__item">
                <TopSellerRankBadge rank={rank} />

                <div className="top-sillers__content">
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
                        <span className="seller-profile__rating-preview-value">{seller.ratingPreview}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="top-sillers__actions">
                  <button
                    type="button"
                    className="top-sillers__action-btn top-sillers__action-btn--chat"
                    onClick={(event) => handleOpenChat(seller.id, event)}
                  >
                    <i className="bx bx-chat" aria-hidden="true" />
                    <span>{t('home.topSillersChat')}</span>
                  </button>
                  <button
                    type="button"
                    className="top-sillers__action-btn top-sillers__action-btn--shop"
                    onClick={(event) => handleOpenShop(seller.id, event)}
                  >
                    <i className="bx bx-store" aria-hidden="true" />
                    <span>{t('home.topSillersShop')}</span>
                  </button>
                </div>
                </div>
              </article>
            </div>
            );
          })}
          </Scrollable>
        )}
      </section>

      {!hideChatModal ? (
      <ProductSellerChatModal
        open={isChatOpen}
        seller={activeChatSeller}
        lang={lang}
        messages={chatMessages}
        loading={isChatLoading}
        onClose={handleCloseChat}
        onSendText={sendChatText}
        onSendImage={sendChatImage}
        onSendProduct={sendChatProduct}
        onDeleteMessage={deleteChatMessage}
        onEditMessage={editChatMessage}
        onDeleteThread={async () => {
          const ok = await deleteChatThread();
          if (ok) {
            handleCloseChat();
          }
          return ok;
        }}
        isPartnerTyping={isSellerTyping}
        isPartnerSending={isSellerPartnerSending}
        isPartnerOnline={isSellerOnline}
        partnerLastActiveAt={sellerLastActiveAt}
        isSending={isChatSending}
        onComposerActivity={handleChatComposerActivity}
        onStopTyping={stopChatTyping}
      />
      ) : null}
    </>
  );
}
