import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../config/api";
import { buildProductCollections } from "../utils/productCatalog";

const AppDataContext = createContext(null);

async function fetchJson(path) {
  const res = await fetch(apiUrl(path));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} → ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

export function AppDataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        productsArr,
        categories,
        navbar,
        homeBanner,
        footer,
        cargo,
        videoBanner,
        sellersWrap,
        defaultProductPolicy,
        uzWarehouse,
        uzbProductDeliveryInfo,
      ] = await Promise.all([
        fetchJson("/api/products"),
        fetchJson("/api/categories"),
        fetchJson("/api/navbar"),
        fetchJson("/api/home-banners"),
        fetchJson("/api/footer"),
        fetchJson("/api/cargo"),
        fetchJson("/api/video-banners"),
        fetchJson("/api/sellers"),
        fetchJson("/api/default-product-policy"),
        fetchJson("/api/uz-warehouse"),
        fetchJson("/api/uzb-product-delivery-info"),
      ]);

      setPayload({
        productsArr: Array.isArray(productsArr) ? productsArr : [],
        categories: categories || {},
        navbar: navbar || {},
        homeBanner: homeBanner || {},
        footer: footer || {},
        cargo: cargo || {},
        videoBanner: videoBanner || {},
        sellersWrap: sellersWrap || {},
        defaultProductPolicy: Array.isArray(defaultProductPolicy) ? defaultProductPolicy : [],
        uzWarehouse: uzWarehouse || {},
        uzbProductDeliveryInfo: uzbProductDeliveryInfo || {},
      });
    } catch (e) {
      setError(e?.message || String(e));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handleRefresh = () => {
      load();
    };
    window.addEventListener('appDataRefreshRequested', handleRefresh);
    return () => window.removeEventListener('appDataRefreshRequested', handleRefresh);
  }, [load]);

  const value = useMemo(() => {
    if (!payload) {
      return {
        loading,
        error,
        reload: load,
        ready: !loading && !error,
        allProducts: [],
        categoriyCountries: [],
        categoriesBrend: [],
        navbarItems: [],
        homeBannerData: [],
        videoBannerData: [],
        footerData: null,
        cargoRates: {},
        deliveryPrices: {},
        sellers: [],
        getSellerById: () => undefined,
        uzWarehouseData: null,
        chinaWarehouseData: null,
        defaultProductPolicy: [],
        uzbProductDeliveryInfo: null,
        ...buildProductCollections([]),
      };
    }

    const cols = buildProductCollections(payload.productsArr);
    const sellers = payload.sellersWrap?.sellers || [];
    const getSellerById = (id) => sellers.find((s) => String(s.id) === String(id));

    return {
      loading,
      error,
      reload: load,
      ready: true,
      allProducts: cols.allProducts,
      categoriyCountries: payload.categories.categoriyCountries || [],
      categoriesBrend: payload.categories.categoriesBrend || [],
      navbarItems: payload.navbar.navbarItems || [],
      homeBannerData: payload.homeBanner.homeBannerData || [],
      videoBannerData: payload.videoBanner.videoBannerData || [],
      footerData: payload.footer.footerData || null,
      cargoRates: payload.cargo.cargoRates || {},
      deliveryPrices: payload.cargo.deliveryPrices || {},
      sellers,
      getSellerById,
      uzWarehouseData: payload.uzWarehouse?.uzWarehouseData || null,
      chinaWarehouseData: payload.uzWarehouse?.chinaWarehouseData || null,
      defaultProductPolicy: payload.defaultProductPolicy,
      uzbProductDeliveryInfo: payload.uzbProductDeliveryInfo?.deliveryInfo || null,
      ...cols,
    };
  }, [payload, loading, error, load]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData faqat AppDataProvider ichida ishlatiladi");
  }
  return ctx;
}
