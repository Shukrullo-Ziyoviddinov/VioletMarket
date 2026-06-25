import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../contexts/AppDataContext';
import ProductCard from '../components/ProductCard';
import Filters from '../components/Filters';
import { SkeletonPulse } from '../components/SkeletonLoader';
import { getProductPriceNumber } from '../utils/utils';
import { isChinaWarehouseProduct } from '../utils/warehouseProduct';
import { sortProductsByGlobalRanking } from '../utils/globalProductRanking';
import './ProductPage.css';

const filterByBrand = (list, brands) => {
  if (!brands.length) return list;
  return list.filter((p) => brands.includes((p.brandCategories || '').toLowerCase()));
};

const filterByCountry = (list, countries) => {
  if (!countries.length) return list;
  return list.filter((p) => countries.includes((p.countriesCategories || '').toLowerCase()));
};

const filterByColor = (list, colors) => {
  if (!colors.length) return list;
  return list.filter((p) =>
    (p.colors || []).some((c) => {
      const val = (c.colorFilter != null ? c.colorFilter : c.name || '').toString().trim();
      return val && colors.includes(val);
    })
  );
};

const filterByLanguage = (list, languages) => {
  if (!languages.length) return list;
  return list.filter((p) => {
    const lang = (p.languageFilter || '').toString().trim().toLowerCase();
    return lang && languages.includes(lang);
  });
};

const filterByGenre = (list, genres) => {
  if (!genres.length) return list;
  return list.filter((p) => {
    const g = (p.genreFilter || '').toString().trim().toLowerCase();
    return g && genres.includes(g);
  });
};

const ChinaWarehousePage = () => {
  const { t } = useTranslation();
  const { allProducts, loading, error, getSellerById } = useAppData();
  const catalog = allProducts || [];
  const appLoading = loading && !error;
  const [priceRange, setPriceRange] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  const categoryProducts = useMemo(
    () => catalog.filter((product) => isChinaWarehouseProduct(product, getSellerById)),
    [catalog, getSellerById]
  );

  const isBooksCategory = useMemo(
    () => categoryProducts.some((p) => (p.category || '').trim() === 'Kitoblar'),
    [categoryProducts]
  );

  const productsAfterPrice = useMemo(() => {
    if (!priceRange) return categoryProducts;
    return categoryProducts.filter((p) => {
      const num = getProductPriceNumber(p);
      if (num == null) return false;
      return num >= priceRange.min && num <= priceRange.max;
    });
  }, [categoryProducts, priceRange]);

  const availableBrands = useMemo(() => {
    const list = filterByCountry(filterByColor(productsAfterPrice, selectedColors), selectedCountries);
    const set = new Set();
    list.forEach((p) => {
      const b = (p.brandCategories || '').toLowerCase();
      if (b) set.add(b);
    });
    return [...set];
  }, [productsAfterPrice, selectedCountries, selectedColors]);

  const availableCountries = useMemo(() => {
    const list = filterByBrand(filterByColor(productsAfterPrice, selectedColors), selectedBrands);
    const set = new Set();
    list.forEach((p) => {
      const c = (p.countriesCategories || '').toLowerCase();
      if (c) set.add(c);
    });
    return [...set];
  }, [productsAfterPrice, selectedBrands, selectedColors]);

  const availableColors = useMemo(() => {
    const list = filterByBrand(filterByCountry(productsAfterPrice, selectedCountries), selectedBrands);
    const set = new Set();
    list.forEach((p) => {
      (p.colors || []).forEach((c) => {
        const val = (c.colorFilter != null ? c.colorFilter : c.name || '').toString().trim();
        if (val) set.add(val);
      });
    });
    return [...set];
  }, [productsAfterPrice, selectedBrands, selectedCountries]);

  const availableLanguages = useMemo(() => {
    if (!isBooksCategory) return [];
    let list = filterByColor(
      filterByCountry(filterByBrand(productsAfterPrice, selectedBrands), selectedCountries),
      selectedColors
    );
    if (selectedGenres.length > 0) {
      list = filterByGenre(list, selectedGenres);
    }
    const set = new Set();
    list.forEach((p) => {
      const lang = (p.languageFilter || '').toString().trim().toLowerCase();
      if (lang) set.add(lang);
    });
    selectedLanguages.forEach((l) => set.add(l));
    return [...set];
  }, [isBooksCategory, productsAfterPrice, selectedBrands, selectedCountries, selectedColors, selectedGenres, selectedLanguages]);

  const availableGenres = useMemo(() => {
    if (!isBooksCategory) return [];
    let list = filterByColor(
      filterByCountry(filterByBrand(productsAfterPrice, selectedBrands), selectedCountries),
      selectedColors
    );
    if (selectedLanguages.length > 0) {
      list = filterByLanguage(list, selectedLanguages);
    }
    const set = new Set();
    list.forEach((p) => {
      const g = (p.genreFilter || '').toString().trim().toLowerCase();
      if (g) set.add(g);
    });
    selectedGenres.forEach((g) => set.add(g));
    return [...set];
  }, [isBooksCategory, productsAfterPrice, selectedBrands, selectedCountries, selectedColors, selectedLanguages, selectedGenres]);

  const finalProducts = useMemo(() => {
    let list = filterByColor(
      filterByCountry(filterByBrand(productsAfterPrice, selectedBrands), selectedCountries),
      selectedColors
    );
    if (isBooksCategory) {
      list = filterByLanguage(list, selectedLanguages);
      list = filterByGenre(list, selectedGenres);
    }
    return sortProductsByGlobalRanking(list);
  }, [productsAfterPrice, selectedBrands, selectedCountries, selectedColors, isBooksCategory, selectedLanguages, selectedGenres]);

  const productsAfterBrand = useMemo(
    () => filterByBrand(productsAfterPrice, selectedBrands),
    [productsAfterPrice, selectedBrands]
  );
  const productsAfterCountry = useMemo(
    () => filterByCountry(productsAfterBrand, selectedCountries),
    [productsAfterBrand, selectedCountries]
  );

  const emptyMessage =
    categoryProducts.length === 0
      ? t('chinaWarehouse.empty')
      : t('chinaWarehouse.filterEmpty');

  return (
    <div className="product-page china-warehouse-page">
      <div className="container">
        <Filters
          categoryProducts={categoryProducts}
          productsAfterPrice={productsAfterPrice}
          productsAfterBrand={productsAfterBrand}
          productsAfterCountry={productsAfterCountry}
          priceRange={priceRange}
          onPriceApply={setPriceRange}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          onBrandApply={() => {}}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          onCountryApply={() => {}}
          availableBrands={availableBrands}
          availableCountries={availableCountries}
          selectedColors={selectedColors}
          setSelectedColors={setSelectedColors}
          onColorApply={() => {}}
          availableColors={availableColors}
          getProductPriceNumber={getProductPriceNumber}
          showBooksFilters={isBooksCategory}
          availableLanguages={availableLanguages}
          availableGenres={availableGenres}
          selectedLanguages={selectedLanguages}
          setSelectedLanguages={setSelectedLanguages}
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          onLanguageApply={() => {}}
          onGenreApply={() => {}}
        />

        {appLoading && catalog.length === 0 ? (
          <div className="products-grid">
            {Array.from({ length: 10 }, (_, i) => (
              <SkeletonPulse
                key={`china-warehouse-sk-${i}`}
                className="product-card product-card--skeleton"
                aria-hidden
              />
            ))}
          </div>
        ) : finalProducts.length === 0 ? (
          <p className="product-page__empty">{emptyMessage}</p>
        ) : (
          <div className="products-grid">
            {finalProducts.map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChinaWarehousePage;
