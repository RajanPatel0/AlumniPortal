import L from 'leaflet';
import { AlumniMarkerData } from '../utils/cluster';
import { defaultAlumniIcon } from '../utils/markerIcons';
import { renderSingleAlumnusPopup } from './PopupRenderer';

/**
 * Creates individual alumnus Leaflet marker with popup attached
 */
export function createIndividualMarker(
  lat: number,
  lng: number,
  person: AlumniMarkerData
): L.Marker {
  const marker = L.marker([lat, lng], { icon: defaultAlumniIcon });
  const popupContent = renderSingleAlumnusPopup(person);
  marker.bindPopup(popupContent);
  return marker;
}
