'use client';

import { useEffect, useRef, useState } from 'react';
import { Mail, Briefcase, MapPin, ExternalLink } from 'lucide-react';
import L from 'leaflet';
import { extendLeaflet } from '@india-boundary-corrector/leaflet-layer';
import { apiFetch, BASE_PATH } from '@/lib/api';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// NOTE: For a more robust, long-term solution, consider transitioning to Mappls (MapmyIndia) SDK.
if (typeof window !== 'undefined') {
  extendLeaflet(L);
}

// Custom Marker Icon definition using CDN links to bypass Webpack loader issues
const defaultIcon = typeof window !== 'undefined' ? L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : undefined;

interface AlumniMapProps {
  filters: {
    batchYear: string;
    branch: string;
    company: string;
    country: string;
  };
}

interface AlumniMarker {
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
}

export default function AlumniMap({ filters }: AlumniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  const [alumni, setAlumni] = useState<AlumniMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [bounds, setBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

  // Center coordinate of Punjab Technical University (Kapurthala, Punjab)
  const defaultCenter: [number, number] = [31.3807, 75.3812];

  // Helper to fetch map bounds
  const getMapBounds = (map: L.Map) => {
    const b = map.getBounds();
    return {
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    };
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 6,
    });

    // @ts-ignore - tileLayer.indiaBoundaryCorrected is added dynamically by extendLeaflet
    const correctedLayer = (L.tileLayer as any).indiaBoundaryCorrected('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      // Serve the PMTiles file locally to avoid CDN fetch failures
      pmtilesUrl: `${BASE_PATH}/india_boundary_corrections.pmtiles`,
      fallbackOnCorrectionFailure: true,
    });

    // Listen for correction errors — suppress AbortErrors which are benign cleanup
    // cancellations triggered by map.remove() or React StrictMode unmount cycle
    correctedLayer.on('correctionerror', (e: any) => {
      if (e.error?.name === 'AbortError') return;
      console.warn('[AlumniMap] Boundary correction failed:', e.error, 'Coords:', e.coords, 'URL:', e.tileUrl);
    });

    correctedLayer.addTo(map);

    mapRef.current = map;

    // Get initial bounds
    setBounds(getMapBounds(map));

    // Event listeners
    const handleMoveOrZoom = () => {
      setBounds(getMapBounds(map));
    };

    map.on('moveend', handleMoveOrZoom);
    map.on('zoomend', handleMoveOrZoom);

    return () => {
      map.off('moveend', handleMoveOrZoom);
      map.off('zoomend', handleMoveOrZoom);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch alumni when bounds or search filters change
  useEffect(() => {
    if (!bounds) return;

    const fetchAlumni = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('north', bounds.north.toString());
        queryParams.append('south', bounds.south.toString());
        queryParams.append('east', bounds.east.toString());
        queryParams.append('west', bounds.west.toString());

        if (filters.batchYear) queryParams.append('batchYear', filters.batchYear);
        if (filters.branch) queryParams.append('branch', filters.branch);
        if (filters.company) queryParams.append('company', filters.company);
        if (filters.country) queryParams.append('country', filters.country);

        const res = await apiFetch(`/alumni/map?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAlumni(data.alumni || []);
        }
      } catch (error) {
        console.error('Failed to fetch map alumni:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, [bounds, filters]);

  // Update Markers on the map when alumni list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!defaultIcon) return;

    // Group alumni by identical coordinates (pincodes)
    const groups: {
      [key: string]: {
        lat: number;
        lng: number;
        displayName: string | null;
        people: AlumniMarker[];
      };
    } = {};

    alumni.forEach((person) => {
      if (!person.location.lat || !person.location.lng) return;
      // Truncate to 5 decimal places to account for minor floating point variances
      const key = `${person.location.lat.toFixed(5)}_${person.location.lng.toFixed(5)}`;
      if (!groups[key]) {
        groups[key] = {
          lat: person.location.lat,
          lng: person.location.lng,
          displayName: person.location.displayName,
          people: [],
        };
      }
      groups[key].people.push(person);
    });

    // Add grouped markers to map
    Object.values(groups).forEach((group) => {
      let marker;
      let popupContent = '';

      if (group.people.length === 1) {
        const person = group.people[0];
        marker = L.marker([group.lat, group.lng], { icon: defaultIcon });
        popupContent = `
          <div class="w-68 p-2.5 font-sans">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] p-0.5 flex-shrink-0">
                <div class="w-full h-full rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                  ${person.avatarUrl 
                    ? `<img src="${person.avatarUrl}" alt="${person.name}" class="w-full h-full object-cover rounded-full" />`
                    : `<span class="text-[#003D7A] font-bold text-base">${person.name.charAt(0).toUpperCase()}</span>`
                  }
                </div>
              </div>
              <div>
                <h4 class="text-sm font-black text-slate-900 leading-tight">${person.name}</h4>
                <p class="text-[10px] font-bold text-slate-500 mt-0.5">${person.branch} • Class of ${person.batchYear}</p>
              </div>
            </div>
            ${(person.currentRole || person.currentCompany) 
              ? `
              <div class="mt-3.5 flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <p class="font-bold text-slate-800 leading-snug">${person.currentRole || 'Alumni'}</p>
                  ${person.currentCompany ? `<p class="text-[10px] text-slate-500 font-semibold">at ${person.currentCompany}</p>` : ''}
                </div>
              </div>
              `
              : ''
            }
            ${group.displayName 
              ? `
              <div class="mt-3 flex items-start gap-1 text-[10px] font-bold text-slate-500">
                <span class="line-clamp-2 leading-tight">${group.displayName}</span>
              </div>
              `
              : ''
            }
            <div class="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2.5">
              <a href="${BASE_PATH}/alumni/profile/${person.id}" class="flex-1 py-2 bg-[#003D7A] hover:bg-[#002f5e] text-white text-center text-xs font-bold rounded-xl transition decoration-none block shadow-sm shadow-blue-900/10">
                View Profile
              </a>
              ${person.linkedinUrl 
                ? `<a href="${person.linkedinUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-xl transition flex items-center justify-center" title="LinkedIn Profile">🔗</a>`
                : ''
              }
            </div>
          </div>
        `;
      } else {
        // Multi-alumni custom rounded badge divIcon
        const count = group.people.length;
        const customClusterIcon = L.divIcon({
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: linear-gradient(135deg, #003D7A 0%, #C41E3A 100%);
              color: white;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 13px;
              font-weight: 900;
              border: 2px solid white;
              box-shadow: 0 4px 12px rgba(196, 30, 58, 0.45);
              cursor: pointer;
              transition: transform 0.2s ease-in-out;
            " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
              ${count}
            </div>
          `,
          className: 'custom-cluster-icon-marker',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -19]
        });

        marker = L.marker([group.lat, group.lng], { icon: customClusterIcon });

        // Sticky header scrollable multi-alumni list popup
        popupContent = `
          <div class="w-76 p-1 font-sans" style="max-height: 290px; overflow-y: auto;">
            <div style="position: sticky; top: 0; background: white; z-index: 10; padding-bottom: 8px; margin-bottom: 10px;" class="border-b border-slate-100 flex flex-col gap-0.5">
              <span class="text-xs font-black text-[#C41E3A] uppercase tracking-wider">${count} Alumni in this area</span>
              ${group.displayName ? `<span class="text-[9px] text-slate-400 font-extrabold leading-tight line-clamp-1">${group.displayName}</span>` : ''}
            </div>
            <div class="space-y-3.5 divide-y divide-slate-50">
              ${group.people.map((person) => `
                <div class="flex items-center justify-between gap-3 pt-3.5 first:pt-0">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] p-0.5 flex-shrink-0">
                      <div class="w-full h-full rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                        ${person.avatarUrl 
                          ? `<img src="${person.avatarUrl}" alt="${person.name}" class="w-full h-full object-cover rounded-full" />`
                          : `<span class="text-[#003D7A] font-bold text-xs">${person.name.charAt(0).toUpperCase()}</span>`
                        }
                      </div>
                    </div>
                    <div class="min-w-0">
                      <h4 class="text-xs font-extrabold text-slate-900 truncate leading-snug">${person.name}</h4>
                      <p class="text-[9px] font-bold text-slate-500 leading-none mt-0.5">${person.branch} • Class of ${person.batchYear}</p>
                      ${person.currentCompany ? `<p class="text-[9px] text-slate-400 font-semibold truncate mt-0.5">${person.currentRole || 'Alumni'} at ${person.currentCompany}</p>` : ''}
                    </div>
                  </div>
                  <a href="${BASE_PATH}/alumni/profile/${person.id}" class="py-1.5 px-3 bg-[#003D7A] hover:bg-[#002f5e] text-white text-center text-[10px] font-extrabold rounded-lg transition decoration-none whitespace-nowrap shadow-sm">
                    View
                  </a>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      marker.bindPopup(popupContent);
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [alumni]);

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] lg:h-[650px] rounded-3xl overflow-hidden shadow-lg border border-slate-200">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-xs font-semibold text-slate-700 flex items-center gap-2 border border-slate-100">
          <div className="w-3.5 h-3.5 border-2 border-[#003D7A] border-t-transparent rounded-full animate-spin" />
          <span>Syncing Alumni...</span>
        </div>
      )}

      {/* Raw Leaflet Map Div Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
