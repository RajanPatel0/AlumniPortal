'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { extendLeaflet } from '@india-boundary-corrector/leaflet-layer';
import { X } from 'lucide-react';
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

const defaultFilters: MapFilters = {
  batchYear: '',
  branch: '',
  company: '',
  country: '',
};

export interface AlumniMapProps {
  filters?: MapFilters;
  isPublic?: boolean;
  heightClass?: string;
  showFullMapButton?: boolean;
}

export default function AlumniMap({
  filters = defaultFilters,
  isPublic = false,
  heightClass = 'h-[480px] sm:h-[560px] lg:h-[620px]',
  showFullMapButton = false,
}: AlumniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Center coordinate of India (covers India and South/SE Asia globally)
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  // 1. Hook for data fetching with debouncing and viewport state
  const { alumni, loading, bounds, zoom } = useMapData(mapInstance, filters);

  // 2. Hook for Supercluster indexing and point retrieval
  const { clusters, supercluster } = useSuperClusters(alumni, bounds, zoom);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 5,
    });

    // @ts-ignore - tileLayer.indiaBoundaryCorrected is added dynamically by extendLeaflet
    const correctedLayer = (L.tileLayer as any).indiaBoundaryCorrected(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        pmtilesUrl: `${BASE_PATH}/india_boundary_corrections.pmtiles`,
        fallbackOnCorrectionFailure: true,
      }
    );

    // Suppress benign AbortError cancellations during tile teardown / dev remounts
    correctedLayer.on('correctionerror', (e: any) => {
      const errStr = String(e?.error?.message || e?.error || e?.message || e);
      if (
        e?.error?.name === 'AbortError' ||
        errStr.includes('AbortError') ||
        errStr.includes('aborted')
      ) {
        return;
      }
      console.warn(
        '[AlumniMap] Boundary correction failed:',
        e.error,
        'Coords:',
        e.coords,
        'URL:',
        e.tileUrl
      );
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

    const handlePublicClick = () => {
      setShowLoginModal(true);
    };

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
          supercluster,
          isPublic,
          handlePublicClick
        );
        layerGroup.addLayer(marker);
      } else {
        const personData = cluster.properties;
        const marker = createIndividualMarker(
          lat,
          lng,
          personData,
          isPublic,
          handlePublicClick
        );
        layerGroup.addLayer(marker);
      }
    });
  }, [clusters, supercluster, isPublic]);

  return (
    <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-100 isolate z-0`}>
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-xs font-semibold text-slate-700 flex items-center gap-2 border border-slate-100">
          <div className="w-3.5 h-3.5 border-2 border-[#003D7A] border-t-transparent rounded-full animate-spin" />
          <span>Syncing Alumni...</span>
        </div>
      )}

      {/* Optional "View Full Map" button overlay */}
      {showFullMapButton && (
        <div className="absolute top-4 left-4 z-[1000]">
          <a
            href={`${BASE_PATH}/alumni/map`}
            className="flex items-center gap-2 px-4 py-2 bg-white/95 hover:bg-white text-[#C41E3A] font-extrabold text-xs rounded-2xl shadow-lg border border-slate-200/80 backdrop-blur-md transition-all duration-200 hover:scale-105"
          >
            <span>≡ View Full Map</span>
          </a>
        </div>
      )}

      {/* Raw Leaflet Map Div Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Public Login Modal overlay matching exact screenshots */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            {/* Header Banner */}
            <div className="bg-[#003D7A] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">Are you from PTU Alumni?</h3>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Body Content */}
            <div className="p-6 text-center space-y-6">
              <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
                Get complete access to alumni portal, if you are member of PTU Alumni
              </p>

              <a
                href={`${BASE_PATH}/alumni/login`}
                className="inline-block w-full py-3 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-black rounded-xl shadow-md transition-all duration-200 uppercase tracking-wider"
              >
                LOGIN TO CONTINUE
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
