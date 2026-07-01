import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../contexts/AppDataContext';
import { SECTION_HOME_DISPLAY_LIMIT } from '../config/sectionLimits';
import ProductCard from '../components/ProductCard';
import ImageBanner from '../components/ImageBanner';
import VideoBanner from '../components/VideoBanner';
import Scrollable from '../components/Scrollable';
import UzWarehouse from '../components/UzWarehouse';
import CartUrgencyBanner from '../components/CartUrgencyBanner/CartUrgencyBanner';
import SectionTitleWithMore from '../components/SectionTitleWithMore';
import HomeCollectionGrid from '../components/HomeCollectionGrid/HomeCollectionGrid';
import RealTimeClock from '../components/RealTimeClock/RealTimeClock';
import { SkeletonPulse } from '../components/SkeletonLoader';
import HomeFeedSwitch from '../components/HomeFeedSwitch/HomeFeedSwitch';
import FlashSaleSection from '../components/FlashSaleSection/FlashSaleSection';
import FlashSaleStatsRow from '../components/FlashSaleSection/FlashSaleStatsRow';
import TopSillers from '../components/TopSillers/TopSillers';
import { sortProductsByGlobalRanking } from '../utils/globalProductRanking';
import './Home.css';

const getNavbarCategoryId = (categoryName, navbarItems, masterCategoryId) => {
  const masterId = Number(masterCategoryId);
  if (Number.isFinite(masterId) && masterId > 0) {
    for (const section of navbarItems || []) {
      const item = (section.items || []).find((i) => Number(i?.masterCategoryId) === masterId);
      if (item?.id != null) return item.id;
    }
  }

  const cat = (categoryName || '').trim();
  for (const section of navbarItems || []) {
    const item = (section.items || []).find((i) => {
      const categoryStr = (i?.category || '').toString().trim();
      if (categoryStr === cat) return true;

      // Oldingi ma'lumotlar uchun fallback (category yo'q bo'lsa)
      const n = i?.name;
      const nameStr =
        typeof n === 'string'
          ? n
          : (n && (n.uz != null || n.ru != null))
            ? (n.uz || n.ru || '')
            : '';
      return (nameStr || '').trim() === cat;
    });
    if (item) return item.id;
  }
  return null;
};

const getBannerLink = (banner, navbarItems, categoriyCountries, categoriesBrend) => {
  if (!banner.clickable) return null;
  const cat = banner.category;
  const masterCategoryId = banner.masterCategoryId;
  const country = (banner.countriesCategories || '').toLowerCase();
  const brand = (banner.brandCategories || '').toLowerCase();
  let slug = null;
  if (cat || masterCategoryId) {
    slug = getNavbarCategoryId(cat, navbarItems, masterCategoryId);
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
    allProducts,
    navbarItems,
    categoriyCountries,
    categoriesBrend,
    sellers,
    topSillers,
    homeBannerData,
    videoBannerData,
    newCollection,
    womensCollection,
    mensCollection,
    booksCollection,
    beautyCareCollection,
    giftsToysCollection,
    activeLifestyleCollection,
    householdAppliancesCollection,
    allKindsProductsCollection,
    bigDiscountCollection,
  } = useAppData();

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
  const [activeHomeFeed, setActiveHomeFeed] = useState('recommended');
  const flashSaleProducts = useMemo(() => {
    const active = (allProducts || []).filter(
      (product) => product?.flashSaleMeta?.flashSaleActive === true,
    );
    return sortProductsByGlobalRanking(active);
  }, [allProducts]);

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

        <CartUrgencyBanner />

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

        <div className="home-feed-switch-wrap">
          <HomeFeedSwitch activeTab={activeHomeFeed} onChange={setActiveHomeFeed} />
        </div>

        {activeHomeFeed === 'discount' ? (
          <>
            <FlashSaleStatsRow flashCount={flashSaleProducts.length} />
            <FlashSaleSection products={flashSaleProducts} isLoading={appLoading} />
          </>
        ) : (
          <div className="home-recommended-feed">
            <HomeCollectionGrid
              categoryName="products"
              title={i18n.t('home.sectionBest')}
              className="product-collection"
              skeletonPrefix="home-best"
              alwaysShow
            />

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

            {(topSillers.length > 0 || appLoading) && (
              <TopSillers
                sellers={topSillers}
                isLoading={appLoading && topSillers.length === 0}
              />
            )}

            <HomeCollectionGrid
              categoryName="engArzonlare"
              title={i18n.t('home.sectionEngArzonlare')}
              className="eng-arzonlare"
              skeletonPrefix="home-cheap"
            />

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

            <HomeCollectionGrid
              categoryName="trendingItems"
              title={i18n.t('home.sectionTrending')}
              moreLink="/trending"
              showMore
              className="trending-section"
              skeletonPrefix="home-trend"
              alwaysShow
            />

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

            <HomeCollectionGrid
              categoryName="electronicsCollection"
              title={i18n.t('home.sectionElectronics')}
              className="electronics-section"
              skeletonPrefix="home-electronics"
            />

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

        <HomeCollectionGrid
          categoryName="stationeryCollection"
          title={i18n.t('home.sectionStationery')}
          className="stationery-section"
          skeletonPrefix="home-stationery"
        />

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

        <HomeCollectionGrid
          categoryName="accessoriesCollection"
          title={i18n.t('home.sectionAccessories')}
          className="accessories-section"
          skeletonPrefix="home-accessories"
        />

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

        <HomeCollectionGrid
          categoryName="vitaminsHealthCollection"
          title={i18n.t('home.sectionVitaminsHealth')}
          className="vitamins-health-section"
          skeletonPrefix="home-vitamins"
        />

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

        <HomeCollectionGrid
          categoryName="travelGearCollection"
          title={i18n.t('home.sectionTravelGear')}
          className="travel-gear-section"
          skeletonPrefix="home-travel"
        />

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
                    : allKindsProductsCollection.map((product, index) => (
                        <ProductCard key={`home-all-kinds-${String(product.id)}-${index}`} product={product} />
                      ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

