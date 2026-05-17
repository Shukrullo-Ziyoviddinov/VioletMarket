const DEFAULT_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+8J+RpDwvdGV4dD48L3N2Zz4=';

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
    isAuthenticated: true,
  };
}
