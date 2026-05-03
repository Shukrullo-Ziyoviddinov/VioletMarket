import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DragScroll from '../DragScroll';
import PriceFilter from './PriceFilter/PriceFilter';
import BrandFilter from './BrandFilter/BrandFilter';
import CountryFilter from './CountryFilter/CountryFilter';
import ColorFilter from './ColorFilter/ColorFilter';
import LanguageFilter from './LanguageFilter/LanguageFilter';
import GenreFilter from './GenreFilter/GenreFilter';
import './Filters.css';

const Filters = ({
  categoryProducts,
  productsAfterPrice,
  productsAfterBrand,
  productsAfterCountry,
  priceRange,
  onPriceApply,
  selectedBrands,
  setSelectedBrands,
  onBrandApply,
  selectedCountries,
  setSelectedCountries,
  onCountryApply,
  availableBrands,
  availableCountries,
  selectedColors,
  setSelectedColors,
  onColorApply,
  availableColors,
  getProductPriceNumber,
  showBooksFilters = false,
  availableLanguages = [],
  availableGenres = [],
  selectedLanguages = [],
  setSelectedLanguages,
  selectedGenres = [],
  setSelectedGenres,
  onLanguageApply,
  onGenreApply,
}) => {
  const { i18n } = useTranslation();
  const [openFilter, setOpenFilter] = useState(null);

  return (
    <div className="filters">
      <DragScroll className="filters-scrollable" direction="horizontal" usePointerCapture={false}>
        <div className="filters-chips">
          <button
            type="button"
            className={`filters-chip ${priceRange ? 'filters-chip--active' : ''}`}
            onClick={() => setOpenFilter('price')}
          >
            {i18n.t('filters.price')}
          </button>
          <button
            type="button"
            className={`filters-chip ${selectedBrands.length ? 'filters-chip--active' : ''}`}
            onClick={() => setOpenFilter('brand')}
          >
            {i18n.t('filters.brand')}
          </button>
          <button
            type="button"
            className={`filters-chip ${selectedCountries.length ? 'filters-chip--active' : ''}`}
            onClick={() => setOpenFilter('country')}
          >
            {i18n.t('filters.country')}
          </button>
          <button
            type="button"
            className={`filters-chip ${selectedColors.length ? 'filters-chip--active' : ''}`}
            onClick={() => setOpenFilter('color')}
          >
            {i18n.t('filters.color')}
          </button>
          {showBooksFilters && (
            <>
              <button
                type="button"
                className={`filters-chip ${selectedLanguages.length ? 'filters-chip--active' : ''}`}
                onClick={() => setOpenFilter('language')}
              >
                {i18n.t('filters.bookLanguage')}
              </button>
              <button
                type="button"
                className={`filters-chip ${selectedGenres.length ? 'filters-chip--active' : ''}`}
                onClick={() => setOpenFilter('genre')}
              >
                {i18n.t('filters.bookGenre')}
              </button>
            </>
          )}
        </div>
      </DragScroll>

      <PriceFilter
        isOpen={openFilter === 'price'}
        onClose={() => setOpenFilter(null)}
        onApply={onPriceApply}
        products={categoryProducts}
        priceRange={priceRange}
        getProductPriceNumber={getProductPriceNumber}
      />
      <BrandFilter
        isOpen={openFilter === 'brand'}
        onClose={() => setOpenFilter(null)}
        onApply={onBrandApply}
        availableBrands={availableBrands}
        selectedBrands={selectedBrands}
        setSelectedBrands={setSelectedBrands}
      />
      <CountryFilter
        isOpen={openFilter === 'country'}
        onClose={() => setOpenFilter(null)}
        onApply={onCountryApply}
        availableCountries={availableCountries}
        selectedCountries={selectedCountries}
        setSelectedCountries={setSelectedCountries}
      />
      <ColorFilter
        isOpen={openFilter === 'color'}
        onClose={() => setOpenFilter(null)}
        onApply={onColorApply}
        availableColors={availableColors}
        selectedColors={selectedColors}
        setSelectedColors={setSelectedColors}
      />
      {showBooksFilters && (
        <>
          <LanguageFilter
            isOpen={openFilter === 'language'}
            onClose={() => setOpenFilter(null)}
            onApply={onLanguageApply}
            availableLanguages={availableLanguages}
            selectedLanguages={selectedLanguages}
            setSelectedLanguages={setSelectedLanguages}
          />
          <GenreFilter
            isOpen={openFilter === 'genre'}
            onClose={() => setOpenFilter(null)}
            onApply={onGenreApply}
            availableGenres={availableGenres}
            selectedGenres={selectedGenres}
            setSelectedGenres={setSelectedGenres}
          />
        </>
      )}
    </div>
  );
};

export default Filters;
