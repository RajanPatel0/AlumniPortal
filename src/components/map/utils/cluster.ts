import { BBox, Feature, Point } from 'geojson';

export interface AlumniMarkerData {
  id: string;
  name: string;
  currentCompany: string | null;
  currentRole: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  batchYear: number;
  branch: string;
  location: {
    lat: number;
    lng: number;
    displayName: string | null;
  };
  campus?: string | null;
  cluster?: boolean;
}

export type AlumniPointFeature = Feature<Point, AlumniMarkerData>;

/**
 * Converts array of alumni marker objects to GeoJSON Point Features for Supercluster
 */
export function alumniToGeoJSONPoints(alumni: AlumniMarkerData[]): AlumniPointFeature[] {
  const seenCoordinates: Record<string, number> = {};

  return alumni
    .filter((person) => person.location && person.location.lat !== null && person.location.lng !== null)
    .map((person) => {
      let lat = person.location.lat;
      let lng = person.location.lng;
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;

      if (seenCoordinates[key] !== undefined) {
        const count = seenCoordinates[key];
        seenCoordinates[key] = count + 1;

        // Apply a small spiral offset to disperse overlapping markers
        const angle = count * 0.85; // Spiral angle increment
        const radius = 0.00015 * Math.sqrt(count); // Spiral radius increment (~15 meters)
        lat += radius * Math.sin(angle);
        lng += radius * Math.cos(angle);
      } else {
        seenCoordinates[key] = 1;
      }

      return {
        type: 'Feature',
        properties: { ...person, cluster: false as const },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      };
    });
}

/**
 * Helper to convert map bounds to Supercluster BBox [west, south, east, north]
 */
export function boundsToBBox(bounds: { north: number; south: number; east: number; west: number }): BBox {
  return [bounds.west, bounds.south, bounds.east, bounds.north];
}
