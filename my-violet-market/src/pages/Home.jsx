import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { products, newCollection, womensCollection, mensCollection, engArzonlare, trendingItems, electronicsCollection, booksCollection, stationeryCollection, beautyCareCollection, accessoriesCollection, giftsToysCollection, vitaminsHealthCollection, activeLifestyleCollection, travelGearCollection, householdAppliancesCollection, allKindsProductsCollection, bigDiscountCollection } from '../data/products';
import { categoriyCountries, categoriesBrend } from '../data/categories';
import { homeBannerData } from '../data/homeBannerData';
import { navbarItems } from '../data/navbarItems';
import { videoBannerData } from '../data/videoBannerData';
import { SECTION_HOME_DISPLAY_LIMIT, LOAD_MORE_INITIAL, LOAD_MORE_STEP } from '../config/sectionLimits';
import ProductCard from '../components/ProductCard';
import ImageBanner from '../components/ImageBanner';
import VideoBanner from '../components/VideoBanner';
import Scrollable from '../components/Scrollable';
import UzWarehouse from '../components/UzWarehouse';
import SectionTitleWithMore from '../components/SectionTitleWithMore';
import LoadMore from '../components/LoadMore';
import RealTimeClock from '../components/RealTimeClock/RealTimeClock';
import './Home.css';

const getNavbarCategoryId = (categoryName) => {
  const cat = (categoryName || '').trim();
  for (const section of navbarItems) {
    const item = (section.items || []).find((i) => {
      const n = i.name;
      const nameStr = typeof n === 'string' ? n : (n && (n.uz != null || n.ru != null)) ? (n.uz || n.ru || '') : '';
      return (nameStr || '').trim() === cat;
    });
    if (item) return item.id;
  }
  return null;
};

const getBannerLink = (banner) => {
  if (!banner.clickable) return null;
  const cat = banner.category;
  const country = (banner.countriesCategories || '').toLowerCase();
  const brand = (banner.brandCategories || '').toLowerCase();
  let slug = null;
  if (cat) {
    slug = getNavbarCategoryId(cat);
  }
  if (!slug && country) {
    const c = categoriyCountries.find((x) => (x.filterValue || '').toLowerCase() === country);
    if (c?.link) slug = c.link.replace(/^\/category\//i, '').trim() || null;
  }
  if (!slug && brand) {
    const b = categoriesBrend.find((x) => (x.filterValue || '').toLowerCase() === brand);
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
      homeBannerData
        .filter((banner) => banner.type === 'image')
        .map((banner) => ({ ...banner, link: getBannerLink(banner) })),
    []
  );

  useEffect(() => {
    setDisplayedProducts(products.slice(0, displayCount));
  }, [displayCount]);

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

  return (
    <div className="home-page">
      {imageBanners.length > 0 && <ImageBanner images={imageBanners} />}
      <UzWarehouse />

      <div className="container">
        <Scrollable
          title="Davlat kategoriyalari"
          items={categoriyCountries}
          type="country"
        />

        <Scrollable
          title="Brend kategoriyalari"
          items={categoriesBrend}
          type="brand"
        />

        {bigDiscountCollection.length > 0 && (
          <div className="big-discount-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionBigDiscount')}
              moreLink="/big-discount"
              showMore={true}
              titleExtra={<RealTimeClock />}
            />
            <Scrollable type="product" className="big-discount-scrollable">
              {bigDiscountCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map(product => (
                <div key={product.id} className="new-collection-product-item">
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
            {displayedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {displayCount < products.length && (
          <LoadMore onLoadMore={handleLoadMore} />
        )}

        {videoBannerData.length > 0 && <VideoBanner videos={videoBannerData} />}

        {newCollection.length > 0 && (
          <div className="new-collection">
            <SectionTitleWithMore
              title={i18n.t('home.sectionNewCollection')}
              moreLink="/new-collection"
              showMore={newCollection.length > SECTION_HOME_DISPLAY_LIMIT}
            />
            <Scrollable type="product" className="new-collection-scrollable">
              {newCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map(product => (
                <div key={product.id} className="new-collection-product-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </Scrollable>
          </div>
        )}

        {engArzonlare.length > 0 && (
          <div className="eng-arzonlare">
            <SectionTitleWithMore
              title={i18n.t('home.sectionEngArzonlare')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {engArzonlare.slice(0, displayCheapestCount).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {displayCheapestCount < engArzonlare.length && (
              <LoadMore onLoadMore={handleLoadMoreCheapest} />
            )}
          </div>
        )}

        {womensCollection.length > 0 && (
          <div className="womens-collection">
            <SectionTitleWithMore
              title={i18n.t('home.sectionWomensCollection')}
              moreLink="/women-collection"
              showMore={womensCollection.length > 0}
            />
            <Scrollable type="product" className="womens-collection-scrollable">
              {womensCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map(product => (
                <div key={product.id} className="new-collection-product-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </Scrollable>
          </div>
        )}

        {trendingItems.length > 0 && (
          <div className="trending-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionTrending')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {trendingItems.slice(0, displayTrendingCount).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {displayTrendingCount < trendingItems.length && (
              <LoadMore onLoadMore={handleLoadMoreTrending} />
            )}
          </div>
        )}

        {mensCollection.length > 0 && (
          <div className="mens-collection">
            <SectionTitleWithMore
              title={i18n.t('home.sectionMensCollection')}
              moreLink="/men-collection"
              showMore={mensCollection.length > 0}
            />
            <Scrollable type="product" className="mens-collection-scrollable">
              {mensCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map(product => (
                <div key={product.id} className="new-collection-product-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </Scrollable>
          </div>
        )}

        {electronicsCollection.length > 0 && (
          <div className="electronics-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionElectronics')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {electronicsCollection.slice(0, displayElectronicsCount).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {displayElectronicsCount < electronicsCollection.length && (
              <LoadMore onLoadMore={handleLoadMoreElectronics} />
            )}
          </div>
        )}

        {booksCollection.length > 0 && (
          <div className="books-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionBooks')}
              moreLink="/category/301"
              showMore={true}
            />
            <Scrollable type="product" className="books-collection-scrollable">
              {booksCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map(product => (
                <div key={product.id} className="new-collection-product-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </Scrollable>
          </div>
        )}

        {stationeryCollection.length > 0 && (
          <div className="stationery-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionStationery')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {stationeryCollection.slice(0, displayStationeryCount).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {displayStationeryCount < stationeryCollection.length && (
              <LoadMore onLoadMore={handleLoadMoreStationery} />
            )}
          </div>
        )}

        {beautyCareCollection.length > 0 && (
          <div className="beauty-care-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionBeautyCare')}
              moreLink="/category/303"
              showMore={true}
            />
            <Scrollable type="product" className="beauty-care-scrollable">
              {beautyCareCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map(product => (
                <div key={product.id} className="new-collection-product-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </Scrollable>
          </div>
        )}

        {accessoriesCollection.length > 0 && (
          <div className="accessories-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionAccessories')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {accessoriesCollection.slice(0, displayAccessoriesCount).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {displayAccessoriesCount < accessoriesCollection.length && (
              <LoadMore onLoadMore={handleLoadMoreAccessories} />
            )}
          </div>
        )}

        {giftsToysCollection.length > 0 && (
          <div className="gifts-toys-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionGiftsToys')}
              moreLink="/category/304"
              showMore={true}
            />
            <Scrollable type="product" className="gifts-toys-scrollable">
              {giftsToysCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map(product => (
                <div key={product.id} className="new-collection-product-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </Scrollable>
          </div>
        )}

        {vitaminsHealthCollection.length > 0 && (
          <div className="vitamins-health-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionVitaminsHealth')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {vitaminsHealthCollection.slice(0, displayVitaminsHealthCount).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {displayVitaminsHealthCount < vitaminsHealthCollection.length && (
              <LoadMore onLoadMore={handleLoadMoreVitaminsHealth} />
            )}
          </div>
        )}

        {activeLifestyleCollection.length > 0 && (
          <div className="active-lifestyle-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionActiveLifestyle')}
              moreLink="/active-lifestyle"
              showMore={true}
            />
            <Scrollable type="product" className="active-lifestyle-scrollable">
              {activeLifestyleCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map(product => (
                <div key={product.id} className="new-collection-product-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </Scrollable>
          </div>
        )}

        {travelGearCollection.length > 0 && (
          <div className="travel-gear-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionTravelGear')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {travelGearCollection.slice(0, displayTravelGearCount).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {displayTravelGearCount < travelGearCollection.length && (
              <LoadMore onLoadMore={handleLoadMoreTravelGear} />
            )}
          </div>
        )}

        {householdAppliancesCollection.length > 0 && (
          <div className="household-appliances-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionHouseholdAppliances')}
              moreLink="/household-appliances"
              showMore={true}
            />
            <Scrollable type="product" className="household-appliances-scrollable">
              {householdAppliancesCollection.slice(0, SECTION_HOME_DISPLAY_LIMIT).map(product => (
                <div key={product.id} className="new-collection-product-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </Scrollable>
          </div>
        )}

        {allKindsProductsCollection.length > 0 && (
          <div className="all-kinds-products-section">
            <SectionTitleWithMore
              title={i18n.t('home.sectionAllKindsProducts')}
              moreLink=""
              showMore={false}
            />
            <div className="products-grid">
              {allKindsProductsCollection.map(product => (
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

