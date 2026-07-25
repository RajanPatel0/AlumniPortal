import { useMemo } from 'react';
import Supercluster from 'supercluster';
import { alumniToGeoJSONPoints, boundsToBBox, AlumniMarkerData, AlumniPointFeature } from '../utils/cluster';
import { MapBounds } from './useMapData';

export function useSuperClusters(
  alumni: AlumniMarkerData[],
  bounds: MapBounds | null,
  zoom: number
) {
  // Convert alumni list to GeoJSON Point Features
  const points = useMemo(() => alumniToGeoJSONPoints(alumni), [alumni]);

  // Create Supercluster index; re-indexes ONLY when points reference changes
  const supercluster = useMemo(() => {
    const sc = new Supercluster<AlumniMarkerData>({
      radius: 75,
      maxZoom: 16,
      minPoints: 2,
    });
    sc.load(points);
    return sc;
  }, [points]);

  // Get clusters for current bounds and zoom level
  const clusters = useMemo(() => {
    if (!bounds) return [];
    const bbox = boundsToBBox(bounds);
    return supercluster.getClusters(bbox, Math.floor(zoom));
  }, [supercluster, bounds, zoom]);

  return { clusters, supercluster };
}
