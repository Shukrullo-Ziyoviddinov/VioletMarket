import React, { useCallback, useEffect, useRef, useState } from 'react';
import { loadYandexMaps } from '../../utils/loadYandexMaps';
import './SellerYandexMap.css';

const DEFAULT_CENTER = [41.311151, 69.279737];
const DEFAULT_ZOOM = 15;

export default function SellerYandexMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  isVisible = true,
  autoLocate = true,
  onLocationChange,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const placemarkRef = useRef(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const geoRequestedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState('');

  onLocationChangeRef.current = onLocationChange;

  const notifyLocation = useCallback((ymaps, coords) => {
    ymaps.geocode(coords, { results: 1 }).then(
      (res) => {
        const first = res.geoObjects.get(0);
        const formatted = first
          ? first.properties.get('metaDataProperty.GeocoderMetaData.Address.formatted') || ''
          : '';
        onLocationChangeRef.current?.({
          coords: [Number(coords[0]), Number(coords[1])],
          address: formatted,
        });
      },
      () => {
        onLocationChangeRef.current?.({
          coords: [Number(coords[0]), Number(coords[1])],
          address: '',
        });
      },
    );
  }, []);

  const setMapPoint = useCallback((ymaps, map, coords) => {
    map.setCenter(coords, map.getZoom(), { duration: 250 });
    if (placemarkRef.current) {
      placemarkRef.current.geometry.setCoordinates(coords);
    } else {
      placemarkRef.current = new ymaps.Placemark(
        coords,
        {},
        { draggable: true, preset: 'islands#violetDotIcon' },
      );
      placemarkRef.current.events.add('dragend', () => {
        const next = placemarkRef.current.geometry.getCoordinates();
        notifyLocation(ymaps, next);
      });
      map.geoObjects.add(placemarkRef.current);
    }
  }, [notifyLocation]);

  useEffect(() => {
    if (!isVisible) {
      geoRequestedRef.current = false;
      return undefined;
    }

    let cancelled = false;

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const initial = Array.isArray(center) && center.length >= 2
          ? [Number(center[0]), Number(center[1])]
          : DEFAULT_CENTER;

        const map = new ymaps.Map(containerRef.current, {
          center: initial,
          zoom,
          controls: ['zoomControl', 'geolocationControl'],
          behaviors: ['default', 'scrollZoom'],
        });

        mapRef.current = map;
        setMapPoint(ymaps, map, initial);
        setMapReady(true);
        setError('');

        map.events.add('click', (event) => {
          const coords = event.get('coords');
          setMapPoint(ymaps, map, coords);
          notifyLocation(ymaps, coords);
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Xarita yuklanmadi');
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        placemarkRef.current = null;
        setMapReady(false);
      }
    };
  }, [isVisible, setMapPoint, notifyLocation, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isVisible || !mapReady || !mapRef.current || !window.ymaps) return;
    if (!autoLocate || geoRequestedRef.current) return;
    if (!navigator.geolocation) return;

    geoRequestedRef.current = true;
    const map = mapRef.current;
    const ymaps = window.ymaps;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setMapPoint(ymaps, map, coords);
        map.setZoom(16, { duration: 300 });
        notifyLocation(ymaps, coords);
      },
      () => {
        geoRequestedRef.current = false;
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, [isVisible, mapReady, autoLocate, setMapPoint, notifyLocation]);

  return (
    <div className="seller-yandex-map">
      <div ref={containerRef} className="seller-yandex-map__canvas" />
      {error ? <p className="seller-yandex-map__error">{error}</p> : null}
    </div>
  );
}
