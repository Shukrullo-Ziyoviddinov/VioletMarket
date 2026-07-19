import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import YandexMap from '../YandexMap';
import './AddressModal.css';

const DEFAULT_CENTER = [41.311151, 69.279737];
const SUGGEST_DEBOUNCE_MS = 350;
const SUGGEST_MAX = 6;

const AddressModal = ({ isOpen, onClose, onSave, initialAddress }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    addressLine: initialAddress?.addressLine ?? '',
    city: initialAddress?.city ?? '',
    district: initialAddress?.district ?? '',
    placeType: initialAddress?.placeType ?? '',
    entrance: initialAddress?.entrance ?? '',
    floor: initialAddress?.floor ?? '',
    domofon: initialAddress?.domofon ?? '',
    courierNote: initialAddress?.courierNote ?? '',
  });
  const [mapCenter, setMapCenter] = useState(
    initialAddress?.coords ? initialAddress.coords : DEFAULT_CENTER
  );
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestTimeoutRef = useRef(null);
  const suggestWrapRef = useRef(null);
  const addressInputRef = useRef(null);
  const addressInputFocusedRef = useRef(false);
  const userSearchedRef = useRef(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [dragY, setDragY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const dragStartRef = useRef(0);
  const handleDownRef = useRef(false);
  const openedAtRef = useRef(0);

  const REQUIRED_FIELDS = ['addressLine', 'placeType', 'entrance', 'floor', 'domofon'];

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      openedAtRef.current = Date.now();
    }
  }, [isOpen]);

  const DRAG_CLOSE_THRESHOLD = 80;

  const handleDragStart = useCallback((clientY) => {
    dragStartRef.current = clientY;
    handleDownRef.current = true;
  }, []);

  const handleDragMove = useCallback((clientY) => {
    if (!handleDownRef.current) return;
    const dy = clientY - dragStartRef.current;
    if (dy > 0) setDragY(dy);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!handleDownRef.current) return;
    handleDownRef.current = false;
    setDragY((prev) => {
      if (prev > DRAG_CLOSE_THRESHOLD) {
        setIsClosing(true);
        setTimeout(onClose, 280);
      }
      return 0;
    });
  }, [onClose]);

  // Fly xaritaga: coords + trigger key (har safar yangi object → effect ishlaydi)
  const doFlyTo = useCallback((coords, formattedAddress) => {
    if (!coords || coords.length < 2) return;
    const c = [Number(coords[0]), Number(coords[1])];
    if (Number.isNaN(c[0]) || Number.isNaN(c[1])) return;
    userSearchedRef.current = true;
    if (formattedAddress) {
      setForm((prev) => ({ ...prev, addressLine: formattedAddress }));
    }
    setMapCenter(c);
    // Har safar yangi object reference → YandexMap effect albatta ishlaydi
    setFlyToCoords({ coords: c, key: Date.now() });
  }, []);

  const handleMyLocation = useCallback(() => {
    if (geoLocating) return;

    if (!navigator.geolocation) {
      alert('Brauzeringiz geolokatsiyani qo\'llab-quvvatlamaydi');
      return;
    }

    setGeoLocating(true);

    const doGeocode = (coords) => {
      const tryGeocode = () => {
        window.ymaps.geocode(coords, { results: 1 }).then((res) => {
          const first = res.geoObjects.get(0);
          const formatted = first
            ? first.properties.get('metaDataProperty.GeocoderMetaData.Address.formatted') || ''
            : '';
          doFlyTo(coords, formatted || null);
          setFieldErrors((prev) => ({ ...prev, addressLine: false }));
          setGeoLocating(false);
        }, () => {
          doFlyTo(coords, null);
          setGeoLocating(false);
        });
      };

      // ymaps hali ready bo'lmagan bo'lishi mumkin
      if (window.ymaps && window.ymaps.geocode) {
        window.ymaps.ready(tryGeocode);
      } else {
        // ymaps yuklanguncha kut
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.ymaps && window.ymaps.geocode) {
            clearInterval(interval);
            window.ymaps.ready(tryGeocode);
          } else if (attempts > 30) {
            clearInterval(interval);
            doFlyTo(coords, null);
            setFieldErrors((prev) => ({ ...prev, addressLine: false }));
            setGeoLocating(false);
          }
        }, 200);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        doGeocode(coords);
      },
      (err) => {
        setGeoLocating(false);
        if (err.code === 1) {
          alert('Joylashuvga ruxsat berilmagan. Brauzer sozlamalaridan ruxsat bering.');
        } else if (err.code === 2) {
          alert('Joylashuv aniqlanmadi. Internetni tekshiring.');
        } else {
          alert('Joylashuvni aniqlashda xatolik yuz berdi.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [geoLocating, doFlyTo]);

  const triggerSearch = useCallback(() => {
    addressInputFocusedRef.current = false;
    addressInputRef.current?.blur();
    const q = form.addressLine.trim();
    if (!q || !window.ymaps) return;

    window.ymaps.geocode(q, { results: 1 }).then((res) => {
      const first = res.geoObjects.get(0);
      if (!first || !first.geometry) return;

      let coords = null;
      try {
        const c = first.geometry.getCoordinates && first.geometry.getCoordinates();
        if (c && Array.isArray(c) && c.length >= 2) {
          coords = [Number(c[0]), Number(c[1])];
        }
      } catch (_) {}

      if (!coords && first.geometry.getBounds) {
        try {
          const b = first.geometry.getBounds();
          if (b && b.length >= 2) {
            coords = [
              (Number(b[0][0]) + Number(b[1][0])) / 2,
              (Number(b[0][1]) + Number(b[1][1])) / 2,
            ];
          }
        } catch (_) {}
      }

      if (!coords) return;

      const formatted =
        first.properties.get('metaDataProperty.GeocoderMetaData.Address.formatted') || '';

      doFlyTo(coords, formatted || null);
      setFieldErrors((prev) => ({ ...prev, addressLine: false }));
    }).catch(() => {});
  }, [form.addressLine, doFlyTo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: false }));
    if (name !== 'addressLine') return;

    if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    suggestTimeoutRef.current = setTimeout(() => {
      if (!window.ymaps) { setSuggestions([]); return; }
      window.ymaps.geocode(q).then((res) => {
        const list = [];
        const count = Math.min(res.geoObjects.getLength(), SUGGEST_MAX);
        for (let i = 0; i < count; i++) {
          const obj = res.geoObjects.get(i);
          const formatted =
            obj.properties.get('metaDataProperty.GeocoderMetaData.Address.formatted') || '';
          const c = obj.geometry.getCoordinates();
          const coords =
            Array.isArray(c) && c.length >= 2 ? [Number(c[0]), Number(c[1])] : null;
          if (formatted && coords) list.push({ formatted, coords });
        }
        setSuggestions(list);
        setSuggestOpen(list.length > 0);
      }).catch(() => setSuggestions([]));
    }, SUGGEST_DEBOUNCE_MS);
  };

  const pickSuggestion = useCallback((item) => {
    const coords =
      Array.isArray(item.coords) && item.coords.length >= 2
        ? [Number(item.coords[0]), Number(item.coords[1])]
        : item.coords;
    doFlyTo(coords, item.formatted);
    setFieldErrors((prev) => ({ ...prev, addressLine: false }));
    setSuggestions([]);
    setSuggestOpen(false);
  }, [doFlyTo]);

  useEffect(() => {
    const close = (e) => {
      if (suggestWrapRef.current && !suggestWrapRef.current.contains(e.target))
        setSuggestOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => () => {
    if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
  }, []);

  const handleMapResult = useCallback((result) => {
    if (!result || !result.address) return;
    if (addressInputFocusedRef.current) return;
    if (result._fromGeolocation && userSearchedRef.current) return;

    const a = result.address;
    const city = a.city || a.locality || a.province || a.area || '';
    const district = a.tuman || a.district || a.area || '';
    const rawParts = [
      a.province, a.locality, a.area, a.district,
      a.mahalla, a.street, a.house,
    ].filter(Boolean);
    const seen = new Set();
    const parts = rawParts.filter((p) => {
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    });
    const line =
      result.formatted && result.formatted.trim()
        ? result.formatted.trim()
        : parts.length > 0
          ? parts.join(', ')
          : '';
    setForm((prev) => ({
      ...prev,
      addressLine: line,
      city: city || prev.city || '',
      district: district || prev.district || '',
    }));
    setFieldErrors((prev) => ({ ...prev, addressLine: false }));
    if (result.coords && result.coords.length >= 2) {
      setMapCenter([Number(result.coords[0]), Number(result.coords[1])]);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    REQUIRED_FIELDS.forEach((key) => {
      if (!(form[key] || '').trim()) errors[key] = true;
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    let city = String(form.city || '').trim();
    let district = String(form.district || '').trim();
    let coords =
      Array.isArray(mapCenter) && mapCenter.length >= 2
        ? [Number(mapCenter[0]), Number(mapCenter[1])]
        : DEFAULT_CENTER;

    // Agar shahar/tuman bo'sh bo'lsa — saqlashdan oldin geocode qilib to'ldiramiz
    if ((!city || !district) && window.ymaps?.geocode) {
      try {
        const res = await window.ymaps.geocode(coords, { results: 1 });
        const first = res.geoObjects.get(0);
        if (first) {
          const addr =
            first.properties.get('metaDataProperty.GeocoderMetaData.Address') ||
            {};
          const components = addr.Components || addr.components || [];
          const getComp = (kind) => {
            const c = components.find(
              (x) => String(x.kind || '').toLowerCase() === kind,
            );
            return c ? String(c.name || '').trim() : '';
          };
          const locality = getComp('locality');
          const province = getComp('province');
          const area = getComp('area');
          const districtComp = getComp('district');
          if (!city) city = locality || province || area || city;
          if (!district) district = districtComp || area || district;
        }
      } catch {
        // geocode bo'lmasa ham manzilni saqlaymiz
      }
    }

    // Matndan ham urinib ko'ramiz (masalan "Chilonzor tumani")
    if (!city || !district) {
      const line = String(form.addressLine || '').trim();
      if (!city) {
        const cityMatch = line.match(
          /\b(Toshkent|Tashkent|Тошкент|Samarqand|Buxoro|Andijon|Namangan|Fargona|Farg'ona|Nukus)\b/i,
        );
        if (cityMatch) {
          city = /toshkent|tashkent|тошкент/i.test(cityMatch[1])
            ? 'Toshkent'
            : cityMatch[1];
        }
      }
      if (!district) {
        const districtMatch =
          line.match(
            /([A-Za-zА-Яа-яЁёЎўҚқҒғҲҳʻ''`-]{3,}?)\s*(tumani|тумани|district)/i,
          ) ||
          line.match(
            /\b(Chilonzor|Yunusobod|Mirzo\s*Ulug'bek|Yakkasaroy|Yashnobod|Sergeli|Uchtepa|Olmazor|Bektemir|Mirobod|Shayxontohur)\b/i,
          );
        if (districtMatch) district = String(districtMatch[1]).trim();
      }
    }

    onSave({
      ...form,
      city,
      district,
      coords,
    });
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e) => {
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      handleDragMove(y);
    };
    const onEnd = () => handleDragEnd();
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
    };
  }, [isOpen, handleDragMove, handleDragEnd]);

  const handleBackdropClose = useCallback(() => {
    if (Date.now() - openedAtRef.current < 250) return;
    setIsClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`address-modal-backdrop ${isClosing ? 'address-modal-backdrop--closing' : ''}`}
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div
        className={`address-modal ${isClosing ? 'address-modal--closing' : ''}`}
        style={!isClosing && dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div
          className="address-modal__handle"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onMouseDown={(e) => handleDragStart(e.clientY)}
        >
          <span className="address-modal__handle-bar" />
        </div>
        <div className="address-modal__inner">
          <div className="address-modal__form-wrap">
            <h3 className="address-modal__title">{t('checkout.addressModalTitle')}</h3>
            <form onSubmit={handleSubmit} className="address-modal__form">
              <div className={`address-modal__field ${fieldErrors.addressLine ? 'address-modal__field--error' : ''}`}>
                <label>{t('checkout.addressLineLabel')}</label>
                <div className="address-modal__search-row">
                  <div ref={suggestWrapRef} className="address-suggest-wrap">
                    <input
                      ref={addressInputRef}
                      type="text"
                      name="addressLine"
                      value={form.addressLine}
                      onChange={handleChange}
                      onFocus={() => {
                        addressInputFocusedRef.current = true;
                        suggestions.length > 0 && setSuggestOpen(true);
                      }}
                      onBlur={() => { addressInputFocusedRef.current = false; }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          triggerSearch();
                        }
                      }}
                      placeholder={t('checkout.addressLinePlaceholder')}
                      autoComplete="off"
                    />
                    {suggestOpen && suggestions.length > 0 && (
                      <ul className="address-suggest-list">
                        {suggestions.map((item, i) => (
                          <li key={i}>
                            <button type="button" onClick={() => pickSuggestion(item)}>
                              {item.formatted}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {form.addressLine && (
                    <button
                      type="button"
                      className="address-suggest-clear"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, addressLine: '' }));
                        setSuggestions([]);
                        setSuggestOpen(false);
                        addressInputRef.current?.focus();
                      }}
                      aria-label={t('checkout.clear')}
                    >
                      ×
                    </button>
                  )}
                  <button
                    type="button"
                    className={`address-modal__geo-btn${geoLocating ? ' address-modal__geo-btn--loading' : ''}`}
                    onClick={handleMyLocation}
                    disabled={geoLocating}
                    title={t('checkout.myLocation') || 'Mening joylashuvim'}
                    aria-label={t('checkout.myLocation') || 'Mening joylashuvim'}
                  >
                    {geoLocating ? (
                      <svg className="address-modal__geo-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {Object.keys(fieldErrors).length > 0 && (
                <p className="address-modal__validation-msg">{t('checkout.fillAllFieldsRequired')}</p>
              )}
              <div className="address-modal__row">
                <div className={`address-modal__field ${fieldErrors.placeType ? 'address-modal__field--error' : ''}`}>
                  <label>{t('checkout.placeTypeLabel')}</label>
                  <input
                    type="text"
                    name="placeType"
                    value={form.placeType}
                    onChange={handleChange}
                    placeholder={t('checkout.placeTypePlaceholder')}
                  />
                </div>
                <div className={`address-modal__field ${fieldErrors.entrance ? 'address-modal__field--error' : ''}`}>
                  <label>{t('checkout.entranceLabel')}</label>
                  <input
                    type="text"
                    name="entrance"
                    value={form.entrance}
                    onChange={handleChange}
                    placeholder={t('checkout.entrancePlaceholder')}
                  />
                </div>
              </div>

              <div className="address-modal__row">
                <div className={`address-modal__field ${fieldErrors.floor ? 'address-modal__field--error' : ''}`}>
                  <label>{t('checkout.floorLabel')}</label>
                  <input
                    type="text"
                    name="floor"
                    value={form.floor}
                    onChange={handleChange}
                    placeholder={t('checkout.floorPlaceholder')}
                  />
                </div>
                <div className={`address-modal__field ${fieldErrors.domofon ? 'address-modal__field--error' : ''}`}>
                  <label>{t('checkout.domofonLabel')}</label>
                  <input
                    type="text"
                    name="domofon"
                    value={form.domofon}
                    onChange={handleChange}
                    placeholder={t('checkout.domofonPlaceholder')}
                  />
                </div>
              </div>

              <div className="address-modal__field address-modal__field_full">
                <label>{t('checkout.courierNoteLabel')}</label>
                <input
                  type="text"
                  name="courierNote"
                  value={form.courierNote}
                  onChange={handleChange}
                  placeholder={t('checkout.courierNotePlaceholder')}
                />
              </div>

              <button type="submit" className="address-modal__save">
                {t('checkout.saveAddress')}
              </button>
            </form>
          </div>

          <div className="address-modal__map-wrap">
            <YandexMap
              center={mapCenter}
              zoom={14}
              onMapClick={handleMapResult}
              flyToCoords={flyToCoords}
              onFlyComplete={() => setFlyToCoords(null)}
              isVisible={isOpen}
              height="100%"
              className="address-modal__map"
            />
          </div>
        </div>

        <button
          type="button"
          className="address-modal__close"
          onClick={handleClose}
          aria-label={t('checkout.close')}
        >
          ×
        </button>
      </div>
    </>
  );
};

export default AddressModal;