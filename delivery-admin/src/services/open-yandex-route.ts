import { Linking } from 'react-native';

type RouteDestination = {
  coords?: number[] | null;
  addressLine?: string;
  city?: string;
  district?: string;
};

/**
 * Loyihada coords = [lat, lng] (Yandex / normalizeDeliveryAddress formati).
 * GeoJSON [lng, lat] emas.
 */
function resolveCoords(coords?: number[] | null) {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lat = Number(coords[0]);
  const lng = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function resolveAddressText(destination: RouteDestination) {
  return (
    String(destination.addressLine || '').trim() ||
    [destination.city, destination.district]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join(', ')
  );
}

async function tryOpen(url: string) {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Yandex Maps / Navigator ilovasida mashrut ochadi.
 * Deep link — API key kerak emas.
 */
export async function openYandexRoute(destination: RouteDestination) {
  const point = resolveCoords(destination.coords);
  const address = resolveAddressText(destination);

  if (!point && !address) {
    return false;
  }

  const urls: string[] = [];

  if (point) {
    // rtext: ~lat,lon — joriy joydan shu nuqtagacha marshrut
    urls.push(
      `yandexmaps://maps.yandex.ru/?rtext=~${point.lat},${point.lng}&rtt=auto`,
    );
    urls.push(
      `yandexnavi://build_route_on_map?lat_to=${point.lat}&lon_to=${point.lng}`,
    );
    urls.push(
      `https://yandex.ru/maps/?rtext=~${point.lat},${point.lng}&rtt=auto`,
    );
  } else {
    const q = encodeURIComponent(address);
    urls.push(`yandexmaps://maps.yandex.ru/?text=${q}`);
    urls.push(`https://yandex.ru/maps/?text=${q}`);
  }

  for (const url of urls) {
    const opened = await tryOpen(url);
    if (opened) return true;
  }

  return false;
}
