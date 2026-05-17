import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useAppData } from '../contexts/AppDataContext';
import { useUser } from '../contexts/UserContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';
import { getProductPriceNumber } from '../utils/utils';
import { searchProducts } from '../api/searchApi';
import ProductCard from '../components/ProductCard';
import Filters from '../components/Filters/Filters';
import { SkeletonPulse } from '../components/SkeletonLoader';
import './ProductPage.css';

const categoryLink = (slug) => `/category/${(slug || '').toLowerCase()}`;

const getNavbarCategoriesFlat = (navbarItems) => {
  const flat = [];
  (navbarItems || []).forEach((section) => {
    (section.items || []).forEach((item) => {
      flat.push({ id: item.id, name: item.name });
    });
  });
  return flat;
};

const ProductPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const {
    loading,
    error,
    reload,
    allProducts,
    newCollection,
    womensCollection,
    mensCollection,
    engArzonlare,
    electronicsCollection,
    booksCollection,
    trendingItems,
    stationeryCollection,
    beautyCareCollection,
    accessoriesCollection,
    giftsToysCollection,
    vitaminsHealthCollection,
    activeLifestyleCollection,
    travelGearCollection,
    householdAppliancesCollection,
    allKindsProductsCollection,
    bigDiscountCollection,
    categoriyCountries,
    categoriesBrend,
    navbarItems,
  } = useAppData();

  const isSearchPage = location.pathname === '/search';
  const isNewCollectionPage = location.pathname === '/new-collection';
  const isWomenCollectionPage = location.pathname === '/women-collection';
  const isMenCollectionPage = location.pathname === '/men-collection';
  const isCheapestPage = location.pathname === '/cheapest';
  const isElectronicsPage = location.pathname === '/electronics';
  const isBooksPage = location.pathname === '/books';
  const isTrendingPage = location.pathname === '/trending';
  const isStationeryPage = location.pathname === '/stationery';
  const isBeautyCarePage = location.pathname === '/beauty-care';
  const isAccessoriesPage = location.pathname === '/accessories';
  const isGiftsToysPage = location.pathname === '/gifts-toys';
  const isVitaminsHealthPage = location.pathname === '/vitamins-health';
  const isActiveLifestylePage = location.pathname === '/active-lifestyle';
  const isTravelGearPage = location.pathname === '/travel-gear';
  const isHouseholdAppliancesPage = location.pathname === '/household-appliances';
  const isAllKindsProductsPage = location.pathname === '/all-kinds-products';
  const isBigDiscountPage = location.pathname === '/big-discount';
  const searchQuery = searchParams.get('q') || '';
  const { authToken } = useUser();
  const { applyHistoryFromSearchResponse } = useSearchHistory();
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!isSearchPage || !searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    setSearchLoading(true);
    searchProducts(searchQuery, undefined, authToken)
      .then((data) => {
        if (!cancelled) {
          setSearchResults(Array.isArray(data.products) ? data.products : []);
          applyHistoryFromSearchResponse(data);
        }
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSearchPage, searchQuery, authToken, applyHistoryFromSearchResponse]);

  const link = categoryLink(slug);
  const slugNum = slug ? Number(slug) : NaN;
  const isNavbarCategorySlug = !isNaN(slugNum);

  const [priceRange, setPriceRange] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  useEffect(() => {
    setPriceRange(null);
    setSelectedBrands([]);
    setSelectedCountries([]);
    setSelectedColors([]);
    setSelectedLanguages([]);
    setSelectedGenres([]);
  }, [slug, searchQuery, location.pathname]);

  const countryItem = !isSearchPage && (categoriyCountries || []).find((c) => c.link === link);
  const brandItem = !isSearchPage && (categoriesBrend || []).find((b) => b.link === link);
  const navbarCategories = useMemo(() => getNavbarCategoriesFlat(navbarItems), [navbarItems]);
  const navbarItem = !isSearchPage && isNavbarCategorySlug ? navbarCategories.find((n) => n.id === slugNum) : null;

  const countryValue = countryItem?.filterValue;
  const brandValue = brandItem?.filterValue;
  // navbarItem.name — ob'ekt { uz, ru }, mahsulotlar category da o'zbekcha string; filtrlash uchun string olamiz
  const navbarCategoryName = navbarItem?.name != null
    ? (typeof navbarItem.name === 'object' ? (navbarItem.name.uz || navbarItem.name.ru || '') : String(navbarItem.name))
    : null;
  const navbarCategoryNameStr = (navbarCategoryName || '').trim() || null;
  const paramCountry = searchParams.get('country') || '';
  const paramBrand = searchParams.get('brand') || '';

  const categoryProducts = useMemo(() => {
    if (isNewCollectionPage) return newCollection;
    if (isWomenCollectionPage) return womensCollection;
    if (isMenCollectionPage) return mensCollection;
    if (isCheapestPage) return engArzonlare;
    if (isElectronicsPage) return electronicsCollection;
    if (isBooksPage) return booksCollection;
    if (isTrendingPage) return trendingItems;
    if (isStationeryPage) return stationeryCollection;
    if (isBeautyCarePage) return beautyCareCollection;
    if (isAccessoriesPage) return accessoriesCollection;
    if (isGiftsToysPage) return giftsToysCollection;
    if (isVitaminsHealthPage) return vitaminsHealthCollection;
    if (isActiveLifestylePage) return activeLifestyleCollection;
    if (isTravelGearPage) return travelGearCollection;
    if (isHouseholdAppliancesPage) return householdAppliancesCollection;
    if (isAllKindsProductsPage) return allKindsProductsCollection;
    if (isBigDiscountPage) return bigDiscountCollection;
    if (isSearchPage) return searchResults;
    let list = allProducts.filter((product) => {
      if (countryValue) {
        return (product.countriesCategories || '').toLowerCase() === countryValue;
      }
      if (brandValue) {
        return (product.brandCategories || '').toLowerCase() === brandValue;
      }
      if (navbarCategoryNameStr) {
        return (product.category || '').trim() === navbarCategoryNameStr;
      }
      return false;
    });
    if (paramCountry) {
      const c = paramCountry.toLowerCase();
      list = list.filter((p) => (p.countriesCategories || '').toLowerCase() === c);
    }
    if (paramBrand) {
      const b = paramBrand.toLowerCase();
      list = list.filter((p) => (p.brandCategories || '').toLowerCase() === b);
    }
    return list;
  }, [
    isNewCollectionPage,
    isWomenCollectionPage,
    isMenCollectionPage,
    isCheapestPage,
    isElectronicsPage,
    isBooksPage,
    isTrendingPage,
    isStationeryPage,
    isBeautyCarePage,
    isAccessoriesPage,
    isGiftsToysPage,
    isVitaminsHealthPage,
    isActiveLifestylePage,
    isTravelGearPage,
    isHouseholdAppliancesPage,
    isAllKindsProductsPage,
    isBigDiscountPage,
    isSearchPage,
    searchResults,
    countryValue,
    brandValue,
    navbarCategoryNameStr,
    paramCountry,
    paramBrand,
    allProducts,
    newCollection,
    womensCollection,
    mensCollection,
    engArzonlare,
    electronicsCollection,
    booksCollection,
    trendingItems,
    stationeryCollection,
    beautyCareCollection,
    accessoriesCollection,
    giftsToysCollection,
    vitaminsHealthCollection,
    activeLifestyleCollection,
    travelGearCollection,
    householdAppliancesCollection,
    allKindsProductsCollection,
    bigDiscountCollection,
  ]);

  const isBooksCategory = useMemo(() => {
    if (isBooksPage || (isNavbarCategorySlug && slugNum === 301) || navbarCategoryNameStr === 'Kitoblar') return true;
    if (isSearchPage && categoryProducts.some((p) => (p.category || '').trim() === 'Kitoblar')) return true;
    return false;
  }, [isBooksPage, isNavbarCategorySlug, slugNum, navbarCategoryNameStr, isSearchPage, categoryProducts]);

  const productsAfterPrice = useMemo(() => {
    if (!priceRange) return categoryProducts;
    return categoryProducts.filter((p) => {
      const num = getProductPriceNumber(p);
      if (num == null) return false;
      return num >= priceRange.min && num <= priceRange.max;
    });
  }, [categoryProducts, priceRange]);

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

  // Har bir filter uchun "mavjud" variantlar — qolgan ikkala filter qo‘yilgan mahsulotlardan (narxdan keyin)
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
    return list;
  }, [productsAfterPrice, selectedBrands, selectedCountries, selectedColors, isBooksCategory, selectedLanguages, selectedGenres]);

  const productsAfterBrand = useMemo(
    () => filterByBrand(productsAfterPrice, selectedBrands),
    [productsAfterPrice, selectedBrands]
  );
  const productsAfterCountry = useMemo(
    () => filterByCountry(productsAfterBrand, selectedCountries),
    [productsAfterBrand, selectedCountries]
  );

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p>API xatosi: {error}</p>
        <button type="button" onClick={() => reload()}>
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className={`product-page${isBigDiscountPage ? ' product-page--big-discount' : ''}`}>
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

        <div className="products-grid">
          {(loading || (isSearchPage && searchLoading)) && !error
            ? Array.from({ length: 10 }, (_, i) => (
                <SkeletonPulse
                  key={`product-page-sk-${i}`}
                  className="product-card product-card--skeleton"
                  aria-hidden
                />
              ))
            : finalProducts.map((product, index) => (
                <ProductCard
                  key={`${product.id}-${index}`}
                  product={product}
                  hideAddToCart={isBigDiscountPage}
                  flashDurationHours={product.flashDurationHours}
                />
              ))}
        </div>
        {!loading && !(isSearchPage && searchLoading) && finalProducts.length === 0 && (
          <p className="product-page__empty">
            {isSearchPage ? 'Qidiruv bo\'yicha mahsulot topilmadi.' : 'Bu kategoriyada mahsulot topilmadi.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
