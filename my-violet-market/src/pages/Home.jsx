import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../contexts/AppDataContext';
import { SECTION_HOME_DISPLAY_LIMIT, LOAD_MORE_INITIAL, LOAD_MORE_STEP } from '../config/sectionLimits';
import ProductCard from '../components/ProductCard';
import ImageBanner from '../components/ImageBanner';
import VideoBanner from '../components/VideoBanner';
import Scrollable from '../components/Scrollable';
import UzWarehouse from '../components/UzWarehouse';
import SectionTitleWithMore from '../components/SectionTitleWithMore';
import LoadMore from '../components/LoadMore';
import RealTimeClock from '../components/RealTimeClock/RealTimeClock';
import { SkeletonPulse } from '../components/SkeletonLoader';
import './Home.css';

const getNavbarCategoryId = (categoryName, navbarItems) => {
  const cat = (categoryName || '').trim();
  for (const section of navbarItems || []) {
    const item = (section.items || []).find((i) => {
      const n = i.name;
      const nameStr = typeof n === 'string' ? n : (n && (n.uz != null || n.ru != null)) ? (n.uz || n.ru || '') : '';
      return (nameStr || '').trim() === cat;
    });
    if (item) return item.id;
  }
  return null;
};

const getBannerLink = (banner, navbarItems, categoriyCountries, categoriesBrend) => {
  if (!banner.clickable) return null;
  const cat = banner.category;
  const country = (banner.countriesCategories || '').toLowerCase();
  const brand = (banner.brandCategories || '').toLowerCase();
  let slug = null;
  if (cat) {
    slug = getNavbarCategoryId(cat, navbarItems);
  }
  if (!slug && country) {
    const c = (categoriyCountries || []).find((x) => (x.filterValue || '').toLowerCase() === country);
    if (c?.link) slug = c.link.replace(/^\/category\//i, '').trim() || null;
  }
  if (!slug && brand) {
    const b = (categoriesBrend || []).find((x) => (x.filterValue || '').toLowerCase() === brand);
    if (b?.link) slug = b.link.replace(/^\/category\//i, '').trim() || null;
  }
  if (!slug) return null;
  const params = new URLSearchParams();
  if (cat && country) params.set('country', country);
  if (cat && brand) params.set('brand', brand);
  const q = params.toString();
  return q ? `/category/${slug}?${q}` : `/category/${slug}`;
};

const Home = () => {
  const { i18n } = useTranslation();
  const {
    loading,
    error,
    reload,
    navbarItems,
    categoriyCountries,
    categoriesBrend,
    homeBannerData,
    videoBannerData,
    products,
    newCollection,
    womensCollection,
    mensCollection,
    engArzonlare,
    trendingItems,
    electronicsCollection,
    booksCollection,
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
  } = useAppData();

  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [displayCount, setDisplayCount] = useState(LOAD_MORE_INITIAL);
  const [displayCheapestCount, setDisplayCheapestCount] = useState(LOAD_MORE_INITIAL);
  const [displayTrendingCount, setDisplayTrendingCount] = useState(LOAD_MORE_INITIAL);
  const [displayElectronicsCount, setDisplayElectronicsCount] = useState(LOAD_MORE_INITIAL);
  const [displayStationeryCount, setDisplayStationeryCount] = useState(LOAD_MORE_INITIAL);
  const [displayAccessoriesCount, setDisplayAccessoriesCount] = useState(LOAD_MORE_INITIAL);
  const [displayVitaminsHealthCount, setDisplayVitaminsHealthCount] = useState(LOAD_MORE_INITIAL);
  const [displayTravelGearCount, setDisplayTravelGearCount] = useState(LOAD_MORE_INITIAL);

  const imageBanners = useMemo(
    () =>
      (homeBannerData || [])
        .filter((banner) => banner.type === 'image')
        .map((banner) => ({
          ...banner,
          link: getBannerLink(banner, navbarItems, categoriyCountries, categoriesBrend),
        })),
    [homeBannerData, navbarItems, categoriyCountries, categoriesBrend]
  );

  useEffect(() => {
    setDisplayedProducts(products.slice(0, displayCount));
  }, [displayCount, products]);

  if (error) {
    return (
      <div className="home-page" style={{ padding: 24 }}>
        <p>API xatosi: {error}</p>
        <p>
          <code>REACT_APP_API_BASE_URL</code> va violet-server ishga tushganini tekshiring.
        </p>
        <button type="button" onClick={() => reload()}>
          Qayta urinish
        </button>
      </div>
    );
  }

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + LOAD_MORE_STEP);
  };

  const handleLoadMoreCheapest = () => {
    setDisplayCheapestCount(prev => prev + LOAD_MORE_STEP);
  };

  const handleLoadMoreTrending = () => {
    setDisplayTrendingCount(prev => prev + LOAD_MORE_STEP);
  };

  const handleLoadMoreElectronics = () => {
    setDisplayElectronicsCount(prev => prev + LOAD_MORE_STEP);
  };

  const handleLoadMoreStationery = () => {
    setDisplayStationeryCount(prev => prev + LOAD_MORE_STEP);
  };

  const handleLoadMoreAccessories = () => {
    setDisplayAccessoriesCount(prev => prev + LOAD_MORE_STEP);
  };

  const handleLoadMoreVitaminsHealth = () => {
    setDisplayVitaminsHealthCount(prev => prev + LOAD_MORE_STEP);
  };

  const handleLoadMoreTravelGear = () => {
    setDisplayTravelGearCount(prev => prev + LOAD_MORE_STEP);
  };

  const appLoading = loading && !error;

  const renderSkeletonProductCardsInGrid = (count, keyPrefix) =>
    Array.from({ length: count }, (_, i) => (
      <SkeletonPulse
        key={`${keyPrefix}-sk-${i}`}
        className="product-card product-card--skeleton"
        aria-hidden
      />
    ));

  const renderSkeletonProductCardsInScrollRow = (count, keyPrefix) =>
    Array.from({ length: count }, (_, i) => (
      <div key={`${keyPrefix}-wrap-${i}`} className="new-collection-product-item">
        <SkeletonPulse className="product-card product-card--skeleton" aria-hidden />
      </div>
    ));

  return (
    <div className="home-page">
      {((loading && !error) || imageBanners.length > 0) && (
        <ImageBanner
          images={imageBanners}
          isLoading={loading && !error && imageBanners.length === 0}
        />
      )}
      <UzWarehouse />

      <div className="container">
        <Scrollable
          title="Davlat kategoriyalari"
          items={categoriyCountries}
          type="country"
          isLoading={appLoading}
        />

        <Scrollable
          title="Brend kategoriyalari"
          items={categoriesBrend}
          type="brand"
          isLoading={appLoading}
        />

        {(bigDiscountCollection.length > 0 || appLoading) && (
          <div className="big-discount-section">
            <SectionTitleWithMore
              className="big-discount-section__header"
              title={i18n.t('home.sectionBigDiscount')}
              subtitle={i18n.t('home.sectionBigDiscountSubtitle')}
              leadingIcon={<i className="bx bxs-bolt" />}
              moreLink="/big-discount"
              showMore={true}
              titleExtra={<RealTimeClock />}
            />
            <Scrollable type="product" className="big-discount-scrollable">
              {appLoading && bigDiscountCollection.length === 0
                ? Array.from({ length: SECTION_HOME_DISPLAY_LIMIT }).map((_, index) => (
                    <div key={`home-big-discount-sk-${index}`} className="new-collection-product-item">
                      <SkeletonPulse
                        className="product-card product-card--skeleton"
                        aria-hidden="true"
                      />
                    </div>
                  ))
                : bigDiscountCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product, index) => (
                    <div key={`home-big-discount-${String(product.id)}-${index}`} className="new-collection-product-item">
                      <ProductCard product={product} hideAddToCart flashDurationHours={product.flashDurationHours} />
                    </div>
                  ))}
            </Scrollable>
          </div>
        )}

        <div className="product-collection">
          <SectionTitleWithMore
            title={i18n.t('home.sectionBest')}
            moreLink=""
            showMore={false}
          />
          <div className="products-grid">
            {appLoading && products.length === 0
              ? renderSkeletonProductCardsInGrid(displayCount, 'home-best')
              : displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </div>

        {!(appLoading && products.length === 0) && displayCount < products.length && (
          <LoadMore onLoadMore={handleLoadMore} />
        )}

        {((appLoading && videoBannerData.length === 0) || videoBannerData.length > 0) && (
          <VideoBanner
            videos={videoBannerData}
            isLoading={appLoading && videoBannerData.length === 0}
          />
        )}

        {(newCollection.length > 0 || appLoading) && (
          <div className="new-collection">
            <SectionTitleWithMore
              title={i18n.t('home.sectionNewCollection')}
              moreLink="/new-collection"
              showMore={newCollection.length > SECTION_HOME_DISPLAY_LIMIT}
            />
            <Scrollable type="product" className="new-collection-scrollable">
              {appLoading && newCollection.length === 0
                ? renderSkeletonProductCardsInScrollRow(SECTION_HOME_DISPLAY_LIMIT, 'home-new')
                : newCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product, index) => (
                    <div key={`home-new-${String(product.id)}-${index}`} className="new-collection-product-item">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </Scrollable>
          </div>
        )}

        {(engArzonlare.length > 0 || appLoading) && (
          <div className="eng-arzonlare">
            <SectionTitleWithMore
              title={i18n.t('home.sectionEngArzonlare')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {appLoading && engArzonlare.length === 0
                ? renderSkeletonProductCardsInGrid(displayCheapestCount, 'home-cheap')
                : engArzonlare.slice(0, displayCheapestCount).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
            {!(appLoading && engArzonlare.length === 0) && displayCheapestCount < engArzonlare.length && (
              <LoadMore onLoadMore={handleLoadMoreCheapest} />
            )}
          </div>
        )}

        {(womensCollection.length > 0 || appLoading) && (
          <div className="womens-collection">
            <SectionTitleWithMore
              title={i18n.t('home.sectionWomensCollection')}
              moreLink="/women-collection"
              showMore={womensCollection.length > 0}
            />
            <Scrollable type="product" className="womens-collection-scrollable">
              {appLoading && womensCollection.length === 0
                ? renderSkeletonProductCardsInScrollRow(SECTION_HOME_DISPLAY_LIMIT, 'home-womens')
                : womensCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product, index) => (
                    <div key={`home-womens-${String(product.id)}-${index}`} className="new-collection-product-item">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </Scrollable>
          </div>
        )}

        {(trendingItems.length > 0 || appLoading) && (
          <div className="trending-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionTrending')}
              moreLink="/trending"
              showMore={trendingItems.length > SECTION_HOME_DISPLAY_LIMIT}
            />
            <div className="products-grid">
              {appLoading && trendingItems.length === 0
                ? renderSkeletonProductCardsInGrid(displayTrendingCount, 'home-trend')
                : trendingItems.slice(0, displayTrendingCount).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
            {!(appLoading && trendingItems.length === 0) && displayTrendingCount < trendingItems.length && (
              <LoadMore onLoadMore={handleLoadMoreTrending} />
            )}
          </div>
        )}

        {(mensCollection.length > 0 || appLoading) && (
          <div className="mens-collection">
            <SectionTitleWithMore
              title={i18n.t('home.sectionMensCollection')}
              moreLink="/men-collection"
              showMore={mensCollection.length > 0}
            />
            <Scrollable type="product" className="mens-collection-scrollable">
              {appLoading && mensCollection.length === 0
                ? renderSkeletonProductCardsInScrollRow(SECTION_HOME_DISPLAY_LIMIT, 'home-mens')
                : mensCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product, index) => (
                    <div key={`home-mens-${String(product.id)}-${index}`} className="new-collection-product-item">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </Scrollable>
          </div>
        )}

        {(electronicsCollection.length > 0 || appLoading) && (
          <div className="electronics-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionElectronics')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {appLoading && electronicsCollection.length === 0
                ? renderSkeletonProductCardsInGrid(displayElectronicsCount, 'home-electronics')
                : electronicsCollection.slice(0, displayElectronicsCount).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
            {!(appLoading && electronicsCollection.length === 0) &&
              displayElectronicsCount < electronicsCollection.length && (
                <LoadMore onLoadMore={handleLoadMoreElectronics} />
              )}
          </div>
        )}

        {(booksCollection.length > 0 || appLoading) && (
          <div className="books-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionBooks')}
              moreLink="/category/301"
              showMore={true}
            />
            <Scrollable type="product" className="books-collection-scrollable">
              {appLoading && booksCollection.length === 0
                ? renderSkeletonProductCardsInScrollRow(SECTION_HOME_DISPLAY_LIMIT, 'home-books')
                : booksCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product, index) => (
                    <div key={`home-books-${String(product.id)}-${index}`} className="new-collection-product-item">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </Scrollable>
          </div>
        )}

        {(stationeryCollection.length > 0 || appLoading) && (
          <div className="stationery-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionStationery')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {appLoading && stationeryCollection.length === 0
                ? renderSkeletonProductCardsInGrid(displayStationeryCount, 'home-stationery')
                : stationeryCollection.slice(0, displayStationeryCount).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
            {!(appLoading && stationeryCollection.length === 0) &&
              displayStationeryCount < stationeryCollection.length && (
                <LoadMore onLoadMore={handleLoadMoreStationery} />
              )}
          </div>
        )}

        {(beautyCareCollection.length > 0 || appLoading) && (
          <div className="beauty-care-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionBeautyCare')}
              moreLink="/category/303"
              showMore={true}
            />
            <Scrollable type="product" className="beauty-care-scrollable">
              {appLoading && beautyCareCollection.length === 0
                ? renderSkeletonProductCardsInScrollRow(SECTION_HOME_DISPLAY_LIMIT, 'home-beauty')
                : beautyCareCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product, index) => (
                    <div key={`home-beauty-${String(product.id)}-${index}`} className="new-collection-product-item">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </Scrollable>
          </div>
        )}

        {(accessoriesCollection.length > 0 || appLoading) && (
          <div className="accessories-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionAccessories')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {appLoading && accessoriesCollection.length === 0
                ? renderSkeletonProductCardsInGrid(displayAccessoriesCount, 'home-accessories')
                : accessoriesCollection.slice(0, displayAccessoriesCount).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
            {!(appLoading && accessoriesCollection.length === 0) &&
              displayAccessoriesCount < accessoriesCollection.length && (
                <LoadMore onLoadMore={handleLoadMoreAccessories} />
              )}
          </div>
        )}

        {(giftsToysCollection.length > 0 || appLoading) && (
          <div className="gifts-toys-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionGiftsToys')}
              moreLink="/category/304"
              showMore={true}
            />
            <Scrollable type="product" className="gifts-toys-scrollable">
              {appLoading && giftsToysCollection.length === 0
                ? renderSkeletonProductCardsInScrollRow(SECTION_HOME_DISPLAY_LIMIT, 'home-gifts')
                : giftsToysCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product, index) => (
                    <div key={`home-gifts-${String(product.id)}-${index}`} className="new-collection-product-item">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </Scrollable>
          </div>
        )}

        {(vitaminsHealthCollection.length > 0 || appLoading) && (
          <div className="vitamins-health-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionVitaminsHealth')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {appLoading && vitaminsHealthCollection.length === 0
                ? renderSkeletonProductCardsInGrid(displayVitaminsHealthCount, 'home-vitamins')
                : vitaminsHealthCollection.slice(0, displayVitaminsHealthCount).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
            {!(appLoading && vitaminsHealthCollection.length === 0) &&
              displayVitaminsHealthCount < vitaminsHealthCollection.length && (
                <LoadMore onLoadMore={handleLoadMoreVitaminsHealth} />
              )}
          </div>
        )}

        {(activeLifestyleCollection.length > 0 || appLoading) && (
          <div className="active-lifestyle-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionActiveLifestyle')}
              moreLink="/active-lifestyle"
              showMore={true}
            />
            <Scrollable type="product" className="active-lifestyle-scrollable">
              {appLoading && activeLifestyleCollection.length === 0
                ? renderSkeletonProductCardsInScrollRow(SECTION_HOME_DISPLAY_LIMIT, 'home-active')
                : activeLifestyleCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product, index) => (
                    <div key={`home-active-${String(product.id)}-${index}`} className="new-collection-product-item">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </Scrollable>
          </div>
        )}

        {(travelGearCollection.length > 0 || appLoading) && (
          <div className="travel-gear-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionTravelGear')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {appLoading && travelGearCollection.length === 0
                ? renderSkeletonProductCardsInGrid(displayTravelGearCount, 'home-travel')
                : travelGearCollection.slice(0, displayTravelGearCount).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
            {!(appLoading && travelGearCollection.length === 0) &&
              displayTravelGearCount < travelGearCollection.length && (
                <LoadMore onLoadMore={handleLoadMoreTravelGear} />
              )}
          </div>
        )}

        {(householdAppliancesCollection.length > 0 || appLoading) && (
          <div className="household-appliances-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionHouseholdAppliances')}
              moreLink="/household-appliances"
              showMore={true}
            />
            <Scrollable type="product" className="household-appliances-scrollable">
              {appLoading && householdAppliancesCollection.length === 0
                ? renderSkeletonProductCardsInScrollRow(SECTION_HOME_DISPLAY_LIMIT, 'home-appliances')
                : householdAppliancesCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product, index) => (
                    <div key={`home-appliances-${String(product.id)}-${index}`} className="new-collection-product-item">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </Scrollable>
          </div>
        )}

        {(allKindsProductsCollection.length > 0 || appLoading) && (
          <div className="all-kinds-products-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionAllKindsProducts')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {appLoading && allKindsProductsCollection.length === 0
                ? renderSkeletonProductCardsInGrid(SECTION_HOME_DISPLAY_LIMIT, 'home-all-kinds')
                : allKindsProductsCollection.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

