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
    rawName: rawItem.name,
    logo: rawItem.logo || FALLBACK_AVATAR,
    orderCount: Math.max(0, Number(rawItem.orderCount) || 0),
    subscriberCount: Math.max(0, Number(rawItem.subscriberCount) || 0),
    averageRating,
  };
}

export default function TopSillers({ sellers = [] }) {
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
        .map((item, index) => normalizeTopSeller(item, index, langKey))
        .filter(Boolean)
        .slice(0, 8),
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

      if (!userData?.isAuthenticated || !authToken) {
        showToast(t('profile.messagesLoginRequired'), 'info');
        navigate('/login');
        return;
      }

      setActiveChatSellerId(sellerId);
      setIsChatOpen(true);
    },
    [authToken, navigate, showToast, t, userData?.isAuthenticated],
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

  if (!normalized.length) return null;

  return (
    <>
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
              </article>
            </div>
          ))}
        </Scrollable>
      </section>

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
    </>
  );
}
