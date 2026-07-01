import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TopSillers from '../TopSillers/TopSillers';
import ChatsPageSearchResultat from '../ChatsPageSearchResultat';
import './ChatsPageSearchModal.css';

const CLOSE_ANIMATION_MS = 340;
const MIN_QUERY_LENGTH = 2;

function TopSillersSection({
  topSillers,
  topSillersLoading,
  onClose,
  onOpenTopSellerChat,
}) {
  if (!topSillersLoading && !topSillers.length) {
    return null;
  }

  return (
    <TopSillers
      sellers={topSillers}
      isLoading={topSillersLoading}
      variant="embedded"
      hideChatModal
      onOpenChat={(sellerId) => {
        onClose?.();
        onOpenTopSellerChat?.(sellerId);
      }}
    />
  );
}

export default function ChatsPageSearchModal({
  open = false,
  query = '',
  onQueryChange,
  onClose,
  topSillers = [],
  topSillersLoading = false,
  onOpenTopSellerChat,
  sellerSearchResults = [],
  sellerSearchLoading = false,
  searchHistoryItems = [],
  searchHistoryLoading = false,
  langKey = 'uz',
  onSellerResultClick,
  onRemoveHistorySeller,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [mounted, setMounted] = useState(open);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setActive(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setActive(false);
    const timer = window.setTimeout(() => setMounted(false), CLOSE_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || !active) return undefined;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, active, onClose]);

  if (!mounted) return null;

  const trimmedQuery = query.trim();
  const hasQuery = Boolean(trimmedQuery);
  const isShortQuery = hasQuery && trimmedQuery.length < MIN_QUERY_LENGTH;
  const showSellerEmpty =
    hasQuery &&
    trimmedQuery.length >= MIN_QUERY_LENGTH &&
    !sellerSearchLoading &&
    !sellerSearchResults.length;
  const showHistory = !hasQuery && (searchHistoryLoading || searchHistoryItems.length > 0);

  return (
    <div
      className={`chats-page-search-modal${active ? ' chats-page-search-modal--open' : ''}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="chats-page-search-modal__header">
        <button
          type="button"
          className="chats-page-search-modal__back"
          onClick={onClose}
          aria-label={t('search.back')}
        >
          <i className="bx bx-chevron-left" aria-hidden="true" />
        </button>

        <div className="chats-page-search-modal__field">
          <i className="bx bx-search chats-page-search-modal__search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            className="chats-page-search-modal__input"
            value={query}
            onChange={(event) => onQueryChange?.(event.target.value)}
            placeholder={t('chats.search.placeholder')}
            aria-label={t('chats.search.label')}
          />
          {query ? (
            <button
              type="button"
              className="chats-page-search-modal__clear"
              onClick={() => onQueryChange?.('')}
              aria-label={t('search.clear')}
            >
              <i className="bx bx-x" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="chats-page-search-modal__body">
        {hasQuery ? (
          <>
            {isShortQuery ? (
              <p className="chats-page-search-modal__hint">{t('chats.search.minChars')}</p>
            ) : showSellerEmpty ? (
              <div className="chats-page-search-modal__empty-state">
                <i className="bx bx-search chats-page-search-modal__empty-icon" aria-hidden="true" />
                <p className="chats-page-search-modal__empty">{t('search.noResults')}</p>
              </div>
            ) : (
              <ChatsPageSearchResultat
                sellers={sellerSearchResults}
                loading={sellerSearchLoading}
                langKey={langKey}
                variant="results"
                className="chats-page-search-resultat--results-inline"
                onSellerClick={(sellerId) => {
                  onClose?.();
                  onSellerResultClick?.(sellerId);
                }}
              />
            )}

            <TopSillersSection
              topSillers={topSillers}
              topSillersLoading={topSillersLoading}
              onClose={onClose}
              onOpenTopSellerChat={onOpenTopSellerChat}
            />
          </>
        ) : (
          <>
            {showHistory ? (
              <section className="chats-page-search-modal__history">
                <h3 className="chats-page-search-modal__history-title">
                  {t('chats.search.historyTitle')}
                </h3>
                <ChatsPageSearchResultat
                  sellers={searchHistoryItems}
                  loading={searchHistoryLoading}
                  langKey={langKey}
                  variant="history"
                  onSellerClick={(sellerId) => {
                    onClose?.();
                    onSellerResultClick?.(sellerId);
                  }}
                  onRemoveSeller={onRemoveHistorySeller}
                />
              </section>
            ) : null}

            {!showHistory && !topSillersLoading && !topSillers.length ? (
              <p className="chats-page-search-modal__hint">{t('chats.search.hint')}</p>
            ) : (
              <TopSillersSection
                topSillers={topSillers}
                topSillersLoading={topSillersLoading}
                onClose={onClose}
                onOpenTopSellerChat={onOpenTopSellerChat}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
