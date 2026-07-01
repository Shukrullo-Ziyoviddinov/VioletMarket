import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TopSillers from '../TopSillers/TopSillers';
import ChatsPageSearchResultat from '../ChatsPageSearchResultat';
import './ChatsPageSearchModal.css';

const CLOSE_ANIMATION_MS = 340;
const MIN_QUERY_LENGTH = 2;

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
  langKey = 'uz',
  onSellerResultClick,
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
            type="search"
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
        {!hasQuery ? (
          topSillersLoading || topSillers.length > 0 ? (
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
          ) : (
            <p className="chats-page-search-modal__hint">{t('chats.search.hint')}</p>
          )
        ) : isShortQuery ? (
          <p className="chats-page-search-modal__hint">{t('chats.search.minChars')}</p>
        ) : showSellerEmpty ? (
          <div className="chats-page-search-modal__empty-state">
            <div className="chats-page-search-modal__empty-icons" aria-hidden="true">
              <i className="bx bx-search" />
              <i className="bx bx-x" />
            </div>
            <p className="chats-page-search-modal__empty">{t('search.noResults')}</p>
          </div>
        ) : (
          <ChatsPageSearchResultat
            sellers={sellerSearchResults}
            loading={sellerSearchLoading}
            langKey={langKey}
            onSellerClick={(sellerId) => {
              onClose?.();
              onSellerResultClick?.(sellerId);
            }}
          />
        )}
      </div>
    </div>
  );
}
