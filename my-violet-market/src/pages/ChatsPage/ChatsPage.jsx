import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../contexts/UserContext';
import { useAppData } from '../../contexts/AppDataContext';
import { deleteMessageChatThread } from '../../api/messageChatApi';
import { useMessageChatThreads } from '../../hooks/useMessageChatThreads';
import { useChatThreadPreferences } from '../../hooks/useChatThreadPreferences';
import { useChatsListPresence } from '../../hooks/useChatsListPresence';
import { useChatsListTyping } from '../../hooks/useChatsListTyping';
import { useSellerMessageChat } from '../../hooks/useSellerMessageChat';
import { useMessageChatTyping } from '../../hooks/useMessageChatTyping';
import { useMessageChatSending } from '../../hooks/useMessageChatSending';
import { useMessageChatPresence } from '../../hooks/useMessageChatPresence';
import {
  filterAndSortChatThreads,
  countUnreadChatThreads,
  buildPreferencesMapFromThreads,
} from '../../utils/chatsThreadUtils';
import ChatsFilter from '../../components/ChatsFilter';
import ChatsThreadList from '../../components/ChatsThreadList';
import ChatsPageSearch from '../../components/ChatsPageSearch';
import ChatsPageSearchModal from '../../components/ChatsPageSearchModal';
import ProductSellerChatModal from '../../components/ProductSellerChatModal';
import MiniModal from '../../components/MiniModal';
import { useChatsPageSellerSearch } from '../../hooks/useChatsPageSellerSearch';
import { useChatsPageSearchHistory } from '../../hooks/useChatsPageSearchHistory';
import './ChatsPage.css';

export default function ChatsPage() {
  const { i18n, t } = useTranslation();
  const { userData, authToken } = useUser();
  const { getSellerById, topSillers, loading: appDataLoading } = useAppData();
  const lang = i18n.language || 'uz';
  const langKey = lang === 'ru' ? 'ru' : 'uz';

  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatSellerId, setActiveChatSellerId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthenticated = Boolean(userData.isAuthenticated && authToken);

  const { threads, loading, reload } = useMessageChatThreads(authToken, isAuthenticated);
  const { togglePin, archiveThread, unarchiveThread } = useChatThreadPreferences(authToken, {
    onUpdated: reload,
  });

  const preferences = useMemo(() => buildPreferencesMapFromThreads(threads), [threads]);

  const filteredThreads = useMemo(
    () => filterAndSortChatThreads(threads, filter, preferences),
    [threads, filter, preferences],
  );

  const { results: sellerSearchResults, loading: sellerSearchLoading } = useChatsPageSellerSearch(
    searchQuery,
    searchOpen,
  );

  const {
    items: searchHistoryItems,
    loading: searchHistoryLoading,
    addSeller: addSearchHistorySeller,
    removeSeller: removeSearchHistorySeller,
  } = useChatsPageSearchHistory(authToken, searchOpen);

  const handleSellerSearchSelect = useCallback(
    async (sellerId) => {
      if (!sellerId) return;
      await addSearchHistorySeller(sellerId);
    },
    [addSearchHistorySeller],
  );

  const unreadThreadCount = useMemo(
    () => countUnreadChatThreads(threads, preferences),
    [threads, preferences],
  );

  const sellerIds = useMemo(
    () => filteredThreads.map((thread) => thread.sellerId),
    [filteredThreads],
  );

  const presenceMap = useChatsListPresence(sellerIds, isAuthenticated);
  const typingMap = useChatsListTyping(sellerIds, isAuthenticated);

  const activeChatSeller = useMemo(() => {
    if (!activeChatSellerId) return null;
    const fromCatalog = getSellerById(activeChatSellerId);
    if (fromCatalog) return fromCatalog;
    const thread = threads.find((item) => item.sellerId === activeChatSellerId);
    if (!thread) return null;
    return {
      id: thread.sellerId,
      name: thread.sellerName,
      logo: thread.sellerLogo,
    };
  }, [activeChatSellerId, getSellerById, threads]);

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

  const handleOpenThread = useCallback((thread) => {
    setActiveChatSellerId(thread.sellerId);
    setIsChatOpen(true);
  }, []);

  const handleOpenTopSellerChat = useCallback(
    (sellerId) => {
      setActiveChatSellerId(sellerId);
      setIsChatOpen(true);
    },
    [],
  );

  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, []);

  useEffect(() => {
    const bgUrl = `${process.env.PUBLIC_URL || ''}/img/chatspadeback.jpg`;
    document.body.classList.add('chats-page-active');
    document.body.style.setProperty('--chats-page-bg', `url("${bgUrl}")`);

    return () => {
      document.body.classList.remove('chats-page-active');
      document.body.style.removeProperty('--chats-page-bg');
    };
  }, []);

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
    setActiveChatSellerId(null);
    reload();
  }, [reload]);

  const handleDeleteRequest = useCallback((thread) => {
    setDeleteTarget(thread);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || !authToken || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteMessageChatThread(authToken, deleteTarget.sellerId);
      if (activeChatSellerId === deleteTarget.sellerId) {
        setIsChatOpen(false);
        setActiveChatSellerId(null);
      }
      setDeleteTarget(null);
      reload();
      window.dispatchEvent(new CustomEvent('messageChatUpdated'));
    } catch {
      // keep modal open on failure
    } finally {
      setIsDeleting(false);
    }
  }, [activeChatSellerId, authToken, deleteTarget, isDeleting, reload]);

  if (!isAuthenticated) {
    return (
      <div className="chats-page">
        <div className="chats-page__panel">
          <div className="chats-page__login">
            <p>{t('chats.loginRequired')}</p>
            <Link to="/login" className="chats-page__login-btn">
              {t('profile.login')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`chats-page${searchOpen ? ' chats-page--search-open' : ''}`}>
      {!searchOpen ? (
        <div className="chats-page__panel">
          <div className="chats-page__header">
            <ChatsPageSearch onOpen={handleOpenSearch} />
          </div>

          <ChatsFilter value={filter} onChange={setFilter} unreadCount={unreadThreadCount} />

          <ChatsThreadList
            threads={filteredThreads}
            loading={loading}
            preferences={preferences}
            presenceMap={presenceMap}
            typingMap={typingMap}
            onOpenThread={handleOpenThread}
            onTogglePin={togglePin}
            onArchiveThread={archiveThread}
            onUnarchiveThread={unarchiveThread}
            onDeleteThread={handleDeleteRequest}
          />
        </div>
      ) : null}

      <ChatsPageSearchModal
        open={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onClose={handleCloseSearch}
        topSillers={topSillers}
        topSillersLoading={appDataLoading && topSillers.length === 0}
        onOpenTopSellerChat={handleOpenTopSellerChat}
        sellerSearchResults={sellerSearchResults}
        sellerSearchLoading={sellerSearchLoading}
        searchHistoryItems={searchHistoryItems}
        searchHistoryLoading={searchHistoryLoading}
        langKey={langKey}
        onSellerResultClick={handleSellerSearchSelect}
        onRemoveHistorySeller={removeSearchHistorySeller}
      />

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

      <MiniModal
        open={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        align="center"
      >
        <h3 className="mini-modal__title">{t('productDetail.chat.deleteThreadTitle')}</h3>
        <p className="mini-modal__text">{t('productDetail.chat.deleteThreadConfirm')}</p>
        <div className="mini-modal__actions">
          <button
            type="button"
            className="mini-modal__btn mini-modal__btn--ghost"
            onClick={() => setDeleteTarget(null)}
            disabled={isDeleting}
          >
            {t('productDetail.chat.deleteThreadNo')}
          </button>
          <button
            type="button"
            className="mini-modal__btn mini-modal__btn--danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {t('productDetail.chat.deleteThreadYes')}
          </button>
        </div>
      </MiniModal>
    </div>
  );
}
