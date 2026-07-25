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
  return alumni
    .filter((person) => person.location && person.location.lat !== null && person.location.lng !== null)
    .map((person) => ({
      type: 'Feature',
      properties: { ...person, cluster: false as const },
      geometry: {
        type: 'Point',
        coordinates: [person.location.lng, person.location.lat],
      },
    }));
}

/**
 * Helper to convert map bounds to Supercluster BBox [west, south, east, north]
 */
export function boundsToBBox(bounds: { north: number; south: number; east: number; west: number }): BBox {
  return [bounds.west, bounds.south, bounds.east, bounds.north];
}
