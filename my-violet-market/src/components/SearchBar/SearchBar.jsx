import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { allProducts } from '../../data/products';
import { useSearchHistory } from '../../contexts/SearchHistoryContext';
import { normalizeImagePath, productMatchesSearchByTitle, getLocalizedText } from '../../utils/utils';
import './SearchBar.css';

const MAX_SUGGESTIONS = 5;
const DEFAULT_RECOMMENDED_COUNT = 15;
const PRODUCT_DETAIL_HISTORY_KEY = 'productDetailViewedProducts';

/** Default recommendations when user has no history (by rating/sales or first N) */
function getDefaultRecommended(allProducts) {
  const withScore = allProducts
    .map((p) => ({
      product: p,
      score: (Number(p.rating) || 0) * 10 + (Number(p.sales) || 0),
    }))
    .sort((a, b) => b.score - a.score);
  return withScore.slice(0, DEFAULT_RECOMMENDED_COUNT).map((x) => x.product);
}

/**
 * Tavsiya etamiz: barcha bo'limlardan (allProducts) mahsulot oladi.
 * Algoritm: ko'rilgan mahsulotlarga o'xshash (category, brand, davlat) + qidirilgan so'rovlarga mos ball, eng yuqori ballilar qaytariladi.
 */
function getSimilarRecommended(allProducts, recentProductIds, recentSearchQueries) {
  const scores = new Map();

  const recentSet = new Set(recentProductIds);
  const recent = (recentProductIds || [])
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean);
  const fields = ['category', 'productCountry', 'brandCategories', 'countriesCategories', 'productType'];

  if (recent.length > 0) {
    allProducts.forEach((p) => {
      if (recentSet.has(p.id)) return;
      let score = 0;
      recent.forEach((r) => {
        fields.forEach((field) => {
          const a = (r[field] || '').toString().toLowerCase();
          const b = (p[field] || '').toString().toLowerCase();
          if (a && b && a === b) score += 2;
        });
      });
      if (score > 0) scores.set(p.id, { product: p, score });
    });
  }

  const getTitleString = (p) => {
    const t = p.title;
    if (t == null) return '';
    if (typeof t === 'string') return t;
    return (t.uz || t.ru || '').toString();
  };

  (recentSearchQueries || []).forEach((q) => {
    const qLower = (q || '').trim().toLowerCase();
    if (qLower.length < 2) return;
    allProducts.forEach((p) => {
      const title = getTitleString(p).toLowerCase();
      if (title.includes(qLower)) {
        const cur = scores.get(p.id);
        const add = 3;
        scores.set(p.id, { product: p, score: (cur?.score ?? 0) + add });
      }
    });
  });

  if (scores.size > 0) {
    return [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, DEFAULT_RECOMMENDED_COUNT)
      .map((x) => x.product);
  }

  return getDefaultRecommended(allProducts);
}

const SearchBar = ({ isMobile = false, className = '' }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const { recentProductIds, addProduct, recentSearchQueries, addSearchQuery, removeSearchQuery } = useSearchHistory();
  const [query, setQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  /* Takliflar va Tavsiya etamiz – barcha bo'limlar (allProducts) dan */
  const suggestions = useMemo(() => {
    if (!(query || '').trim()) return [];
    return allProducts
      .filter((p) => productMatchesSearchByTitle(p, query))
      .slice(0, MAX_SUGGESTIONS);
  }, [query]);

  const recommended = useMemo(
    () => getSimilarRecommended(allProducts, recentProductIds, recentSearchQueries),
    [recentProductIds, recentSearchQueries]
  );

  const showRecommendations = !query.trim() && isPanelOpen;
  const showSuggestions = query.trim() && isPanelOpen;

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
    addProduct(product);
    const q = (inputRef.current?.value ?? query).toString().trim();
    if (q) addSearchQuery(q);
    setIsPanelOpen(false);
    setQuery('');
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
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
    addProduct(product);
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
                <div className="search-bar__recommended-list">
                  {recommended.length === 0 ? (
                    <p className="search-bar__recommended-empty">{i18n.t('search.recommendedEmpty')}</p>
                  ) : (
                    recommended.map((product) => {
                      const firstColor = product.colors?.[0];
                      const price = firstColor?.price || product.price || '';
                      const originalPrice = firstColor?.originalPrice || product.originalPrice || null;
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
                          </div>
                          <div className="search-bar__recommended-info">
                            <span className="search-bar__recommended-name">{getLocalizedText(product.title, lang)}</span>
                            <div className="search-bar__recommended-prices">
                              <span className="search-bar__recommended-price">{price}</span>
                              {originalPrice && (
                                <span className="search-bar__recommended-original">{originalPrice}</span>
                              )}
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
    </div>
  );
};

export default SearchBar;
