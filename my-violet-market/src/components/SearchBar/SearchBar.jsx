import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../../contexts/AppDataContext';
import { useSearchHistory } from '../../contexts/SearchHistoryContext';
import { useUser } from '../../contexts/UserContext';
import { normalizeImagePath, getLocalizedText, formatPrice } from '../../utils/utils';
import CartModal from '../CartModal/CartModal';
import {
  fetchSearchRecommended,
  fetchSearchRecommendedDefault,
} from '../../api/searchApi';
import { SkeletonPulse } from '../SkeletonLoader';
import './SearchBar.css';

const MAX_SUGGESTIONS = 5;
/** Server searchAlgorithm.js — SEARCH_RECOMMENDED_LIMIT bilan bir xil */
const SEARCH_RECOMMENDED_SKELETON_COUNT = 12;
const PRODUCT_DETAIL_HISTORY_KEY = 'productDetailViewedProducts';

function normalizeForSearch(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[-''`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function productMatchesSearchByTitle(product, searchQuery, lang) {
  const q = normalizeForSearch(searchQuery);
  if (!q) return false;
  const title = normalizeForSearch(
    getLocalizedText(product.title, lang) ||
      getLocalizedText(product.title, 'uz') ||
      getLocalizedText(product.title, 'ru') ||
      '',
  );
  return title.includes(q) || (q.length >= 3 && title.length >= 3 && q.includes(title));
}

const SearchBar = ({ isMobile = false, className = '' }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { allProducts, loading, error } = useAppData();
  const catalog = allProducts || [];
  const appLoading = loading && !error;
  const lang = i18n.language || 'uz';
  const { authToken } = useUser();
  const { recentSearchQueries, addSearchQuery, removeSearchQuery, refreshHistory } =
    useSearchHistory();
  const [query, setQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [cartModalProduct, setCartModalProduct] = useState(null);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  /* Takliflar — katalog; Tavsiya etamiz — server /api/search/recommended */
  const suggestions = useMemo(() => {
    if (!(query || '').trim()) return [];
    return catalog
      .filter((p) => productMatchesSearchByTitle(p, query, lang))
      .slice(0, MAX_SUGGESTIONS);
  }, [query, catalog, lang]);

  const showRecommendations = !query.trim() && isPanelOpen;
  const showSuggestions = query.trim() && isPanelOpen;

  useEffect(() => {
    if (isPanelOpen) {
      refreshHistory();
    }
  }, [isPanelOpen, refreshHistory]);

  useEffect(() => {
    if (!showRecommendations) return undefined;

    let cancelled = false;
    setRecommendedLoading(true);
    const fetchRecommended = authToken
      ? fetchSearchRecommended(authToken)
      : fetchSearchRecommendedDefault();

    fetchRecommended
      .then((data) => {
        if (!cancelled) {
          setRecommended(Array.isArray(data.products) ? data.products : []);
        }
      })
      .catch(() => {
        if (!cancelled) setRecommended([]);
      })
      .finally(() => {
        if (!cancelled) setRecommendedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showRecommendations, authToken, recentSearchQueries]);

  useEffect(() => {
    if (!isPanelOpen) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isPanelOpen]);

  const handleFocus = () => setIsPanelOpen(true);
  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };
  const handleBack = () => {
    setIsPanelOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleSuggestionClick = (product) => {
    const clickedLabel = getLocalizedText(product.title, lang).trim();
    if (clickedLabel) addSearchQuery(clickedLabel);
    setIsPanelOpen(false);
    setQuery('');
    if (clickedLabel) {
      navigate(`/search?q=${encodeURIComponent(clickedLabel)}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = (inputRef.current?.value ?? query).toString().trim();
    if (q) {
      addSearchQuery(q);
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setIsPanelOpen(false);
      setQuery('');
    }
  };

  const handleHistoryItemClick = (text) => {
    navigate(`/search?q=${encodeURIComponent(text)}`);
    setIsPanelOpen(false);
    setQuery('');
  };

  const handleRemoveHistoryItem = (e, text) => {
    e.stopPropagation();
    removeSearchQuery(text);
  };

  const handleRecommendedClick = (product) => {
    try {
      sessionStorage.setItem('selectedProduct', JSON.stringify(product));
      if (window.location.pathname !== '/product-detail') {
        sessionStorage.setItem(PRODUCT_DETAIL_HISTORY_KEY, JSON.stringify([product]));
      }
    } catch {}
    setIsPanelOpen(false);
    setQuery('');
    if (window.location.pathname === '/product-detail') {
      window.dispatchEvent(new Event('productStorageChange'));
    } else {
      navigate('/product-detail');
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`search-bar ${className} ${isPanelOpen ? 'search-bar--panel-open' : ''} ${isMobile ? 'search-bar--mobile' : ''}`}
    >
      {isMobile && isPanelOpen && (
        <button
          type="button"
          className="search-bar__back"
          onClick={handleBack}
          aria-label={i18n.t('search.back')}
        >
          <i className="bx bx-chevron-left"></i>
        </button>
      )}
      <form className="search-bar__form" onSubmit={handleSubmit}>
        {!isMobile && (
          <span className="search-bar__icon search-bar__icon--lupa" aria-hidden>
            <i className="bx bx-search"></i>
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder={i18n.t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onClick={handleFocus}
          aria-expanded={isPanelOpen}
          aria-autocomplete="list"
        />
        {query.length > 0 && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
            aria-label={i18n.t('search.clear')}
          >
            <i className="bx bx-x"></i>
          </button>
        )}
        <button type="submit" className="search-bar__submit" aria-label={i18n.t('search.search')}>
          <i className="bx bx-search"></i>
        </button>
      </form>

      {isPanelOpen && (
        <div className="search-bar__panel">
          <div className="search-bar__panel-inner">
            {showSuggestions && (
              <ul className="search-bar__suggestions" role="listbox">
                {suggestions.length === 0 ? (
                  <li className="search-bar__suggestions-empty">{i18n.t('search.noResults')}</li>
                ) : (
                  suggestions.map((product) => (
                    <li
                      key={product.id}
                      role="option"
                      className="search-bar__suggestion-item"
                      onClick={() => handleSuggestionClick(product)}
                    >
                      <span className="search-bar__suggestion-title">{getLocalizedText(product.title, lang)}</span>
                    </li>
                  ))
                )}
              </ul>
            )}

            {showRecommendations && (
              <>
                {recentSearchQueries.length > 0 && (
                  <div className="search-bar__history">
                    <h3 className="search-bar__history-title">{i18n.t('search.historyTitle')}</h3>
                    {recentSearchQueries.map((text) => (
                      <div
                        key={text}
                        className="search-bar__history-item"
                        onClick={() => handleHistoryItemClick(text)}
                      >
                        <span className="search-bar__history-icon">
                          <i className="bx bx-search"></i>
                        </span>
                        <span className="search-bar__history-text">{text}</span>
                        <button
                          type="button"
                          className="search-bar__history-remove"
                          onClick={(e) => handleRemoveHistoryItem(e, text)}
                          aria-label={i18n.t('search.remove')}
                        >
                          <i className="bx bx-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="search-bar__recommended">
                  <h3 className="search-bar__recommended-title">{i18n.t('search.recommendedTitle')}</h3>
                <div
                  className="search-bar__recommended-list"
                  aria-busy={recommendedLoading || appLoading}
                >
                  {recommendedLoading || appLoading ? (
                    Array.from({ length: SEARCH_RECOMMENDED_SKELETON_COUNT }, (_, index) => (
                      <div
                        key={`search-bar-rec-sk-${index}`}
                        className="search-bar__recommended-item search-bar__recommended-item--skeleton"
                        aria-hidden
                      >
                        <div className="search-bar__recommended-image">
                          <SkeletonPulse className="search-bar__recommended-image-skeleton skeleton-pulse--fill" />
                        </div>
                        <div className="search-bar__recommended-info">
                          <SkeletonPulse className="search-bar__recommended-name-skeleton" />
                          <div className="search-bar__recommended-bottom">
                            <SkeletonPulse className="search-bar__recommended-price-skeleton" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : recommended.length === 0 ? (
                    <p className="search-bar__recommended-empty">{i18n.t('search.recommendedEmpty')}</p>
                  ) : (
                    recommended.map((product) => {
                      const firstColor = product.colors?.[0];
                      const price = firstColor?.price || product.price || '';
                      const originalPrice = firstColor?.originalPrice || product.originalPrice || null;
                      const productTitle = getLocalizedText(product.title, lang);
                      return (
                        <div
                          key={product.id}
                          className="search-bar__recommended-item"
                          onClick={() => handleRecommendedClick(product)}
                        >
                          <div className="search-bar__recommended-image">
                            <img
                              src={normalizeImagePath(
                                product.colors?.[0]?.mainImage ||
                                product.mainImage ||
                                product.descriptionImages?.[0]
                              )}
                              alt=""
                              onError={(e) => {
                                e.target.src = normalizeImagePath('/img/no-image.png');
                              }}
                            />
                            <button
                              type="button"
                              className="search-bar__recommended-cart-btn"
                              aria-label={i18n.t('productCard.addToCart')}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCartModalProduct(product);
                              }}
                            >
                              <i className="fas fa-shopping-cart" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="search-bar__recommended-info">
                            <span
                              className="search-bar__recommended-name"
                              title={productTitle}
                            >
                              {productTitle}
                            </span>
                            <div className="search-bar__recommended-bottom">
                              <div className="search-bar__recommended-prices">
                                <span className="search-bar__recommended-price">
                                  {formatPrice(price)}
                                </span>
                                {originalPrice && (
                                  <span className="search-bar__recommended-original">
                                    {formatPrice(originalPrice)}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="search-bar__recommended-link-btn"
                                aria-label={i18n.t('search.openProduct')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRecommendedClick(product);
                                }}
                              >
                                <i className="bx bx-link-external" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <CartModal
        product={cartModalProduct}
        isOpen={Boolean(cartModalProduct)}
        onClose={() => setCartModalProduct(null)}
      />
    </div>
  );
};

export default SearchBar;
