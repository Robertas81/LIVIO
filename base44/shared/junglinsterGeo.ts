// Geo filter for the Junglinster construction site.
// Photos whose GPS metadata falls within RADIUS_KM of the site center are kept.
const JUNGLINSTER = { lat: 49.7056, lng: 6.2464 };
const RADIUS_KM = 3;

function toRad(d) {
  return (d * Math.PI) / 180;
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isJunglinster(lat, lng) {
  if (lat == null || lng == null) return false;
  return haversineKm(JUNGLINSTER.lat, JUNGLINSTER.lng, lat, lng) <= RADIUS_KM;
}

export const JUNGLINSTER_CENTER = JUNGLINSTER;
export const JUNGLINSTER_RADIUS_KM = RADIUS_KM;