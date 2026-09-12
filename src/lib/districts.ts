/**
 * Manual location fallback for when the browser denies or cannot get GPS.
 * Kept as a TS module (not JSON in /data) because the picker needs it in the
 * client bundle without an extra round trip.
 *
 * `state` doubles as the region key for the mandi price lookup.
 */

export interface District {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
}

export const districts: District[] = [
  { id: "ludhiana", name: "Ludhiana", state: "Punjab", lat: 30.901, lon: 75.8573 },
  { id: "patiala", name: "Patiala", state: "Punjab", lat: 30.3398, lon: 76.3869 },
  { id: "karnal", name: "Karnal", state: "Haryana", lat: 29.6857, lon: 76.9905 },
  { id: "meerut", name: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lon: 77.7064 },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", lat: 26.9124, lon: 75.7873 },
  { id: "kota", name: "Kota", state: "Rajasthan", lat: 25.2138, lon: 75.8648 },
  { id: "bhopal", name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lon: 77.4126 },
  { id: "indore", name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  { id: "ahmedabad", name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lon: 72.5714 },
  { id: "rajkot", name: "Rajkot", state: "Gujarat", lat: 22.3039, lon: 70.8022 },
  { id: "nashik", name: "Nashik", state: "Maharashtra", lat: 19.9975, lon: 73.7898 },
  { id: "pune", name: "Pune", state: "Maharashtra", lat: 18.5204, lon: 73.8567 },
  { id: "belagavi", name: "Belagavi", state: "Karnataka", lat: 15.8497, lon: 74.4977 },
  { id: "bengaluru", name: "Bengaluru", state: "Karnataka", lat: 12.9716, lon: 77.5946 },
  { id: "guntur", name: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lon: 80.4365 },
  { id: "patna", name: "Patna", state: "Bihar", lat: 25.5941, lon: 85.1376 },
  { id: "bardhaman", name: "Bardhaman", state: "West Bengal", lat: 23.2324, lon: 87.8615 },
];

export function findDistrict(id: string): District | undefined {
  return districts.find((d) => d.id === id);
}

/**
 * Nearest listed district to a GPS fix, by plain squared distance. Good enough
 * to guess which state's mandi prices to show; not a geocoder.
 */
export function nearestDistrict(lat: number, lon: number): District {
  return districts.reduce((closest, district) => {
    const distance = (district.lat - lat) ** 2 + (district.lon - lon) ** 2;
    const best = (closest.lat - lat) ** 2 + (closest.lon - lon) ** 2;
    return distance < best ? district : closest;
  });
}
