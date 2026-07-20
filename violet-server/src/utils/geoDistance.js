function toRad(value) {
  return (Number(value) * Math.PI) / 180;
}

function haversineKm(from, to) {
  if (!Array.isArray(from) || !Array.isArray(to) || from.length < 2 || to.length < 2) {
    return null;
  }
  const lat1 = Number(from[0]);
  const lon1 = Number(from[1]);
  const lat2 = Number(to[0]);
  const lon2 = Number(to[1]);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

module.exports = {
  haversineKm,
};
