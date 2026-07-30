import * as Location from 'expo-location';

export type CourierCoords = {
  latitude: number;
  longitude: number;
};

const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;

export async function requestCourierLocation(options?: {
  preferFresh?: boolean;
}): Promise<{
  coords: CourierCoords | null;
  denied: boolean;
  errorMessage?: string;
}> {
  const preferFresh = Boolean(options?.preferFresh);

  try {
    const current = await Location.getForegroundPermissionsAsync();
    let status = current.status;

    if (status !== Location.PermissionStatus.GRANTED) {
      const asked = await Location.requestForegroundPermissionsAsync();
      status = asked.status;
    }

    if (status !== Location.PermissionStatus.GRANTED) {
      return {
        coords: null,
        denied: true,
        errorMessage:
          'Joylashuv ruxsati berilmadi. Masofa filtri ishlashi uchun GPS ruxsatini yoqing.',
      };
    }

    if (!preferFresh) {
      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords) {
        const ageMs = Date.now() - Number(last.timestamp || 0);
        const latitude = Number(last.coords.latitude);
        const longitude = Number(last.coords.longitude);
        if (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          Number.isFinite(ageMs) &&
          ageMs >= 0 &&
          ageMs <= LAST_KNOWN_MAX_AGE_MS
        ) {
          return {
            coords: { latitude, longitude },
            denied: false,
          };
        }
      }
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const latitude = Number(position?.coords?.latitude);
    const longitude = Number(position?.coords?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        coords: null,
        denied: false,
        errorMessage: 'Joylashuvni aniqlab bo‘lmadi',
      };
    }

    return {
      coords: { latitude, longitude },
      denied: false,
    };
  } catch {
    return {
      coords: null,
      denied: false,
      errorMessage: 'Joylashuvni olishda xatolik yuz berdi',
    };
  }
}
