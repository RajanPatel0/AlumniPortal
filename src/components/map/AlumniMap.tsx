'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { extendLeaflet } from '@india-boundary-corrector/leaflet-layer';
import { BASE_PATH } from '@/lib/api';
import { MapFilters, useMapData } from './hooks/useMapData';
import { useSuperClusters } from './hooks/useSuperClusters';
import { createIndividualMarker } from './renderers/MarkerRenderer';
import { createClusterMarker } from './renderers/ClusterRenderer';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

if (typeof window !== 'undefined') {
  extendLeaflet(L);
}

export interface AlumniMapProps {
  filters: MapFilters;
}

export default function AlumniMap({ filters }: AlumniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Center coordinate of Punjab Technical University (Kapurthala, Punjab)
  const defaultCenter: [number, number] = [31.3807, 75.3812];

  // 1. Hook for data fetching with debouncing and viewport state
  const { alumni, loading, bounds, zoom } = useMapData(mapInstance, filters);

  // 2. Hook for Supercluster indexing and point retrieval
  const { clusters, supercluster } = useSuperClusters(alumni, bounds, zoom);

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
      pmtilesUrl: `${BASE_PATH}/india_boundary_corrections.pmtiles`,
      fallbackOnCorrectionFailure: true,
    });

    correctedLayer.on('correctionerror', (e: any) => {
      if (e.error?.name === 'AbortError') return;
      console.warn('[AlumniMap] Boundary correction failed:', e.error, 'Coords:', e.coords, 'URL:', e.tileUrl);
    });

    correctedLayer.addTo(map);

    // Create LayerGroup for managing active markers efficiently
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    mapRef.current = map;
    setMapInstance(map);

    return () => {
      layerGroup.clearLayers();
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
  }, []);

  // Update Markers & Clusters on the map whenever clusters change
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Clear existing rendered marker layers
    layerGroup.clearLayers();

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;

      if (cluster.properties.cluster) {
        const { cluster_id: clusterId, point_count: pointCount } = cluster.properties as {
          cluster_id: number;
          point_count: number;
        };
        const marker = createClusterMarker(
          lat,
          lng,
          pointCount,
          clusterId,
          map,
          supercluster
        );
        layerGroup.addLayer(marker);
      } else {
        const personData = cluster.properties;
        const marker = createIndividualMarker(lat, lng, personData);
        layerGroup.addLayer(marker);
      }
    });
  }, [clusters, supercluster]);

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
