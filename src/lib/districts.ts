/**
 * Kerala's 14 districts, used for the manual location fallback when the browser
 * denies or cannot get a GPS fix.
 *
 * Kept as a TS module rather than JSON in /data because the picker needs it in
 * the client bundle without an extra round trip.
 *
 * Coordinates are each district's headquarters town. `state` doubles as the
 * region key for the mandi price lookup.
 */

export interface District {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
}

/** Listed north to south is unhelpful for scanning, so these are alphabetical. */
export const districts: District[] = [
  { id: "alappuzha", name: "Alappuzha", state: "Kerala", lat: 9.4981, lon: 76.3388 },
  { id: "ernakulam", name: "Ernakulam", state: "Kerala", lat: 9.9816, lon: 76.2999 },
  { id: "idukki", name: "Idukki", state: "Kerala", lat: 9.8497, lon: 76.9806 },
  { id: "kannur", name: "Kannur", state: "Kerala", lat: 11.8745, lon: 75.3704 },
  { id: "kasaragod", name: "Kasaragod", state: "Kerala", lat: 12.4996, lon: 74.9869 },
  { id: "kollam", name: "Kollam", state: "Kerala", lat: 8.8932, lon: 76.6141 },
  { id: "kottayam", name: "Kottayam", state: "Kerala", lat: 9.5916, lon: 76.5222 },
  { id: "kozhikode", name: "Kozhikode", state: "Kerala", lat: 11.2588, lon: 75.7804 },
  { id: "malappuram", name: "Malappuram", state: "Kerala", lat: 11.051, lon: 76.0711 },
  { id: "palakkad", name: "Palakkad", state: "Kerala", lat: 10.7867, lon: 76.6548 },
  {
    id: "pathanamthitta",
    name: "Pathanamthitta",
    state: "Kerala",
    lat: 9.2648,
    lon: 76.787,
  },
  {
    id: "thiruvananthapuram",
    name: "Thiruvananthapuram",
    state: "Kerala",
    lat: 8.5241,
    lon: 76.9366,
  },
  { id: "thrissur", name: "Thrissur", state: "Kerala", lat: 10.5276, lon: 76.2144 },
  { id: "wayanad", name: "Wayanad", state: "Kerala", lat: 11.6854, lon: 76.132 },
];

/**
 * How far a GPS fix may sit from the nearest listed district before we stop
 * claiming it belongs to that district.
 *
 * Kerala is long but narrow, and with all 14 headquarters listed, nowhere inside
 * the state is much more than 70km from one. 120km leaves margin for a farm on a
 * border while still rejecting a fix from another state, where naming a Kerala
 * district would simply be wrong.
 */
export const COVERAGE_RADIUS_KM = 120;

export function findDistrict(id: string): District | undefined {
  return districts.find((d) => d.id === id);
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance in kilometres. Worth the extra arithmetic over comparing
 * raw squared degrees, because the result is checked against a distance
 * threshold in kilometres and degrees of longitude shrink as you move north.
 */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export interface NearestDistrictMatch {
  district: District;
  distanceKm: number;
  /** False when the fix is too far away for the district name to be meaningful. */
  withinCoverage: boolean;
}

/**
 * Closest listed district to a GPS fix. Not a geocoder: it answers "which
 * district's mandi rates are relevant here", and reports how far off it is so
 * the caller can decline to name a district for a fix outside Kerala.
 */
export function nearestDistrict(lat: number, lon: number): NearestDistrictMatch {
  let closest = districts[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const district of districts) {
    const distance = distanceKm(lat, lon, district.lat, district.lon);
    if (distance < closestDistance) {
      closest = district;
      closestDistance = distance;
    }
  }

  return {
    district: closest,
    distanceKm: Math.round(closestDistance),
    withinCoverage: closestDistance <= COVERAGE_RADIUS_KM,
  };
}
