import L from 'leaflet';
import Supercluster from 'supercluster';
import { createClusterIcon } from '../utils/markerIcons';
import { AlumniMarkerData } from '../utils/cluster';

/**
 * Creates cluster Leaflet marker with click flyTo expansion behavior
 */
export function createClusterMarker(
  lat: number,
  lng: number,
  pointCount: number,
  clusterId: number,
  map: L.Map,
  supercluster: Supercluster<AlumniMarkerData>
): L.Marker {
  const icon = createClusterIcon(pointCount);
  const marker = L.marker([lat, lng], { icon });

  // On click: expand cluster smoothly using map.flyTo()
  marker.on('click', () => {
    try {
      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(clusterId),
        18
      );
      map.flyTo([lat, lng], expansionZoom, {
        animate: true,
        duration: 0.8,
      });
    } catch (err) {
      console.warn('Failed to calculate expansion zoom for cluster:', err);
      map.flyTo([lat, lng], map.getZoom() + 2);
    }
  });

  return marker;
}
