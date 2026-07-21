const YANDEX_MAPS_SRC =
  'https://api-maps.yandex.ru/2.1/?apikey=9e9fd294-849e-4eb0-898c-a566a9e0c509&lang=uz_UZ';

let loadPromise = null;

export function loadYandexMaps() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window mavjud emas'));
  }

  if (window.ymaps?.ready) {
    return new Promise((resolve) => {
      window.ymaps.ready(() => resolve(window.ymaps));
    });
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-yandex-maps="seller"]');
    if (existing) {
      existing.addEventListener('load', () => {
        window.ymaps.ready(() => resolve(window.ymaps));
      });
      existing.addEventListener('error', () => reject(new Error('Yandex Maps yuklanmadi')));
      return;
    }

    const script = document.createElement('script');
    script.src = YANDEX_MAPS_SRC;
    script.async = true;
    script.dataset.yandexMaps = 'seller';
    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error('Yandex Maps yuklanmadi'));
        return;
      }
      window.ymaps.ready(() => resolve(window.ymaps));
    };
    script.onerror = () => reject(new Error('Yandex Maps yuklanmadi'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
