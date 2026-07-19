import * as Location from 'expo-location';

export type CourierCoords = {
  latitude: number;
  longitude: number;
};

export async function requestCourierLocation(): Promise<{
  coords: CourierCoords | null;
  denied: boolean;
  errorMessage?: string;
}> {
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

    // Avval oxirgi ma'lum joy — tez; bo'lmasa yangi GPS
    const last = await Location.getLastKnownPositionAsync();
    if (last?.coords) {
      const latitude = Number(last.coords.latitude);
      const longitude = Number(last.coords.longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        // Fondda aniqroq yangilab qo'yamiz (kutmaymiz)
        void Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);

        return {
          coords: { latitude, longitude },
          denied: false,
        };
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
