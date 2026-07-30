const DEFAULT_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+8J+RpDwvdGV4dD48L3N2Zz4=';

function pickNonEmpty(apiValue, prevValue) {
  const api = apiValue != null ? String(apiValue).trim() : '';
  if (api) return api;
  const prev = prevValue != null ? String(prevValue).trim() : '';
  if (prev) return prev;
  return '';
}

/** Backend /api/profile/me user → frontend userData */
export function mapApiUserToClient(user) {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    email: user.email || '',
    birthDate: user.birthDate || '',
    gender: user.gender || '',
    language: user.language || 'uz',
    sellerAccountId: user.sellerAccountId ?? null,
    profileImage: user.profileImage || DEFAULT_AVATAR,
    hasUploadedImage: Boolean(user.hasUploadedImage),
    savedDeliveryAddress: user.savedDeliveryAddress || null,
    isAuthenticated: true,
  };
}

/** API javobini local cache bilan birlashtiradi — bo'sh API maydonlari local qiymatni o'chirmaydi */
export function mergeApiUserWithClient(prev, apiUser) {
  const mapped = mapApiUserToClient(apiUser);
  if (!mapped) return prev;
  const base = prev && typeof prev === 'object' ? prev : {};
  return {
    ...base,
    ...mapped,
    id: mapped.id || base.id || null,
    firstName: pickNonEmpty(mapped.firstName, base.firstName),
    lastName: pickNonEmpty(mapped.lastName, base.lastName),
    phone: pickNonEmpty(mapped.phone, base.phone),
    email: pickNonEmpty(mapped.email, base.email),
    birthDate: pickNonEmpty(mapped.birthDate, base.birthDate),
    gender: pickNonEmpty(mapped.gender, base.gender),
    language: mapped.language || base.language || 'uz',
    sellerAccountId: mapped.sellerAccountId ?? base.sellerAccountId ?? null,
    profileImage:
      mapped.profileImage && mapped.profileImage !== DEFAULT_AVATAR
        ? mapped.profileImage
        : base.profileImage || mapped.profileImage,
    hasUploadedImage: mapped.hasUploadedImage || base.hasUploadedImage,
    savedDeliveryAddress:
      mapped.savedDeliveryAddress || base.savedDeliveryAddress || null,
    isAuthenticated: true,
  };
}
