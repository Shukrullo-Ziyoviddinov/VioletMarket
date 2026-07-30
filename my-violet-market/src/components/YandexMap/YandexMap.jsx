import React, { useEffect, useRef, useCallback, useState } from 'react';
import './YandexMap.css';

const DEFAULT_CENTER = [41.311151, 69.279737]; // Toshkent
const DEFAULT_ZOOM = 14;

function getAddressFromGeoObject(geoObject) {
  if (!geoObject) return null;
  const props = geoObject.properties;
  if (!props || !props.get) return null;
  const addr = props.get('metaDataProperty.GeocoderMetaData.Address');
  if (!addr) return null;
  const components = addr.Components || addr.components || [];
  const getComp = (kind) => {
    const c = components.find((x) => (x.kind || '').toLowerCase() === kind);
    return c ? c.name : '';
  };
  const country = getComp('country');
  const province = getComp('province');
  const area = getComp('area');
  const locality = getComp('locality');
  const district = getComp('district');
  const street = getComp('street');
  const house = getComp('house');
  const metro = getComp('metro');
  const other = getComp('other');
  const city = locality || province || area;
  return {
    formatted: addr.formatted || '',
    country, province, area, locality, district,
    street, house, metro, other, city,
    tuman: district || area,
    kocha: street,
    mahalla: other || '',
    uy: house,
  };
}

const YandexMap = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onMapClick,
  // flyToCoords: { coords: [lat, lon], key: timestamp } — har safar yangi object
  flyToCoords = null,
  onFlyComplete,
  className = '',
  height = '400px',
  isVisible = true,
  skipAutoGeolocation = false,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const [isBouncing, setIsBouncing] = useState(false);
  const setBounceRef = useRef(setIsBouncing);
  setBounceRef.current = setIsBouncing;

  const geoRequestedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const setMapReadyRef = useRef(setMapReady);
  setMapReadyRef.current = setMapReady;

  // Oxirgi fly key — takrorlanmaslik uchun
  const lastFlyKeyRef = useRef(null);

  const initMap = useCallback(() => {
    if (!window.ymaps || !containerRef.current || mapRef.current) return;
    const ymaps = window.ymaps;
    ymaps.ready(() => {
      if (mapRef.current) return; // double-init himoya
      const map = new ymaps.Map(containerRef.current, {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'geolocationControl'],
        behaviors: ['default', 'scrollZoom'],
      });
      mapRef.current = map;
      setMapReadyRef.current(true);

      function geocodeAndNotify(coords) {
        ymaps.geocode(coords).then((res) => {
          const first = res.geoObjects.get(0);
          const addressData = getAddressFromGeoObject(first);
          const formatted = first
            ? first.properties.get('metaDataProperty.GeocoderMetaData.Address.formatted')
            : '';
          if (onMapClickRef.current) {
            onMapClickRef.current({
              coords,
              address: addressData,
              formatted: formatted || (addressData && addressData.formatted) || '',
            });
          }
        }).catch(() => {});
      }

      map.events.add('actionbegin', () => {
        setBounceRef.current(true);
      });
      map.events.add('actionend', () => {
        setBounceRef.current(false);
        const newCenter = map.getCenter();
        if (newCenter) {
          const coords = [newCenter[0], newCenter[1]];
          geocodeAndNotify(coords);
        }
      });

      map.events.add('click', (e) => {
        const coords = e.get('coords');
        map.setCenter(coords, map.getZoom(), { duration: 200 });
        geocodeAndNotify(coords);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Modal yopilganda geolocation qayta so'rash uchun reset
  useEffect(() => {
    if (!isVisible) geoRequestedRef.current = false;
  }, [isVisible]);

  // Modal ochilganda — geolocation avtomatik aniqlash
  useEffect(() => {
    if (
      !isVisible ||
      !mapReady ||
      !mapRef.current ||
      !window.ymaps ||
      geoRequestedRef.current ||
      skipAutoGeolocation
    ) {
      return;
    }
    geoRequestedRef.current = true;
    const map = mapRef.current;

    const doGeolocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCoords = [pos.coords.latitude, pos.coords.longitude];
          map.setCenter(userCoords, 16, { duration: 400 });
          window.ymaps.geocode(userCoords).then((res) => {
            const first = res.geoObjects.get(0);
            const addressData = getAddressFromGeoObject(first);
            const formatted = first
              ? first.properties.get('metaDataProperty.GeocoderMetaData.Address.formatted')
              : '';
            if (onMapClickRef.current) {
              onMapClickRef.current({
                coords: userCoords,
                address: addressData,
                formatted: formatted || (addressData && addressData.formatted) || '',
                _fromGeolocation: true,
              });
            }
          }).catch(() => {});
        },
        () => { geoRequestedRef.current = false; },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    };

    const t = setTimeout(doGeolocation, 400);
    return () => clearTimeout(t);
  }, [isVisible, mapReady, skipAutoGeolocation]);

  // Xaritani init qilish
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.ymaps) {
      initMap();
    } else {
      const t = setInterval(() => {
        if (window.ymaps) {
          clearInterval(t);
          initMap();
        }
      }, 200);
      return () => clearInterval(t);
    }
  }, [initMap]);

  // =====================================================
  // ASOSIY TUZATISH: flyToCoords — qidiruv/suggest natijasi
  // flyToCoords = { coords: [lat, lon], key: timestamp }
  // key o'zgarganda effect albatta ishlaydi
  // =====================================================
  useEffect(() => {
    if (!flyToCoords || !mapReady || !mapRef.current || !window.ymaps) return;

    // Takrorlanishni oldini olish
    if (flyToCoords.key && flyToCoords.key === lastFlyKeyRef.current) return;
    lastFlyKeyRef.current = flyToCoords.key;

    const c = flyToCoords.coords;
    if (!Array.isArray(c) || c.length < 2) return;
    const lat = Number(c[0]);
    const lon = Number(c[1]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;

    const map = mapRef.current;

    // fitToViewport — modal ichida xarita to'g'ri o'lchamda bo'lishi uchun
    if (map.container && typeof map.container.fitToViewport === 'function') {
      try { map.container.fitToViewport(); } catch (_) {}
    }

    let timeoutId;
    const rafId = requestAnimationFrame(() => {
      map.setCenter([lat, lon], 17, { duration: 400 });
      timeoutId = setTimeout(() => {
        onFlyComplete && onFlyComplete();
      }, 450);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [flyToCoords, mapReady, onFlyComplete]);

  // Wheel zoom — pin ustida ham ishlashi uchun
  const wrapperRef = useRef(null);
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const onWheel = (e) => {
      if (!mapRef.current) return;
      e.preventDefault();
      const map = mapRef.current;
      const z = map.getZoom();
      const newZoom = e.deltaY > 0 ? Math.max(0, z - 1) : Math.min(21, z + 1);
      if (newZoom !== z) map.setZoom(newZoom, { duration: 120 });
    };
    wrapper.addEventListener('wheel', onWheel, { passive: false });
    return () => wrapper.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div ref={wrapperRef} className={`yandex-map-wrapper ${className}`} style={{ height }}>
      <div ref={containerRef} className="yandex-map" style={{ height }} />
      <div
        className={`yandex-map-pin ${isBouncing ? 'yandex-map-pin--bounce' : ''}`}
        aria-hidden="true"
      />
    </div>
  );
};

export default YandexMap;
