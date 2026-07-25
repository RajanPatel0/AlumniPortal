import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { AlumniMarkerData } from '../utils/cluster';

export interface MapFilters {
  batchYear: string;
  branch: string;
  company: string;
  country: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Fetch alumni map markers for given viewport bounds and filters.
 * Uses TanStack Query for automatic request deduping, inflight cancellation, and instant cache retrieval.
 */
async function fetchMapAlumni(
  bounds: MapBounds | null,
  zoom: number,
  filters: MapFilters,
  signal?: AbortSignal
): Promise<AlumniMarkerData[]> {
  if (!bounds) return [];

  const queryParams = new URLSearchParams();
  queryParams.append('north', bounds.north.toFixed(4));
  queryParams.append('south', bounds.south.toFixed(4));
  queryParams.append('east', bounds.east.toFixed(4));
  queryParams.append('west', bounds.west.toFixed(4));
  queryParams.append('zoom', zoom.toString());

  if (filters.batchYear) queryParams.append('batchYear', filters.batchYear);
  if (filters.branch) queryParams.append('branch', filters.branch);
  if (filters.company) queryParams.append('company', filters.company);
  if (filters.country) queryParams.append('country', filters.country);

  const res = await apiFetch(`/alumni/map?${queryParams.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load alumni map data: ${res.statusText}`);
  }

  const data = await res.json();
  return data.alumni || [];
}

export function useMapData(map: L.Map | null, filters: MapFilters) {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [zoom, setZoom] = useState<number>(6);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to retrieve current map bounds
  const updateMapViewState = (m: L.Map) => {
    const b = m.getBounds();
    setBounds({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
    setZoom(m.getZoom());
  };

  // Set initial bounds and subscribe to map movement/zoom with 250ms debouncing
  useEffect(() => {
    if (!map) return;

    updateMapViewState(map);

    const handleMoveOrZoom = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        updateMapViewState(map);
      }, 250);
    };

    map.on('moveend', handleMoveOrZoom);
    map.on('zoomend', handleMoveOrZoom);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      map.off('moveend', handleMoveOrZoom);
      map.off('zoomend', handleMoveOrZoom);
    };
  }, [map]);

  // Stable query key string matching coordinate precision
  const boundsKey = bounds
    ? `${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.west.toFixed(4)}`
    : 'null';

  // TanStack Query handles automatic inflight signal cancellation, caching, and instant background updates
  const { data: alumni = [], isLoading, isFetching } = useQuery({
    queryKey: ['alumniMap', boundsKey, zoom, filters],
    queryFn: ({ signal }) => fetchMapAlumni(bounds, zoom, filters, signal),
    enabled: !!bounds,
    staleTime: 3 * 60 * 1000, // Keep cache fresh for 3 mins
    gcTime: 15 * 60 * 1000,   // Retain tile cache for 15 mins
    placeholderData: (previousData) => previousData, // Seamless instant transition on filter / pan change
  });

  return {
    alumni,
    loading: isLoading || isFetching,
    bounds,
    zoom,
  };
}
