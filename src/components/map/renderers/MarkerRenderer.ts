import L from 'leaflet';
import { AlumniMarkerData } from '../utils/cluster';
import { defaultAlumniIcon, createSingleNumberIcon } from '../utils/markerIcons';
import { renderSingleAlumnusPopup } from './PopupRenderer';

/**
 * Creates individual alumnus Leaflet marker with popup attached
 */
export function createIndividualMarker(
  lat: number,
  lng: number,
  person: AlumniMarkerData,
  isPublic?: boolean,
  onPublicClick?: () => void
): L.Marker {
  const icon = isPublic ? createSingleNumberIcon(1) : defaultAlumniIcon;
  const marker = L.marker([lat, lng], { icon });

  if (isPublic && onPublicClick) {
    marker.on('click', () => {
      onPublicClick();
    });
  } else {
    const popupContent = renderSingleAlumnusPopup(person);
    marker.bindPopup(popupContent);
  }

  return marker;
}
