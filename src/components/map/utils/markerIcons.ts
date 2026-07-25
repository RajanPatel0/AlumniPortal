import L from 'leaflet';

/**
 * Default icon for individual alumni markers with CDN fallback
 */
export const defaultAlumniIcon = typeof window !== 'undefined'
  ? L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
  : undefined;

/**
 * Calculates pixel diameter using sqrt(count) scaling
 */
export function calculateClusterSize(pointCount: number): number {
  if (pointCount <= 1) return 28;
  // Base formula: 24 + sqrt(pointCount) * 4.5, capped between 28px and 60px
  const size = Math.round(24 + Math.sqrt(pointCount) * 4.5);
  return Math.min(Math.max(size, 28), 60);
}

/**
 * Creates custom divIcon for cluster markers adhering to PTU palette (#003D7A and #C41E3A)
 */
export function createClusterIcon(pointCount: number): L.DivIcon {
  const size = calculateClusterSize(pointCount);
  const fontSize = size >= 48 ? 14 : size >= 36 ? 12 : 11;

  const formattedCount = pointCount >= 1000 ? `${(pointCount / 1000).toFixed(1)}k` : pointCount;

  const html = `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      cursor: pointer;
      user-select: none;
    ">
      <!-- Outer glowing pulse aura -->
      <div style="
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(0, 61, 122, 0.45), rgba(196, 30, 58, 0.45));
        filter: blur(4px);
        animation: pulse-aura 2.5s infinite ease-in-out;
      "></div>

      <!-- Main Cluster Badge -->
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, #003D7A 0%, #1E5086 50%, #C41E3A 100%);
        color: #ffffff;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        font-size: ${fontSize}px;
        font-weight: 800;
        letter-spacing: -0.02em;
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 8px 20px -4px rgba(0, 61, 122, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(8px);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      " onmouseover="this.style.transform='scale(1.15)'; this.previousElementSibling.style.opacity='0.8';" 
         onmouseout="this.style.transform='scale(1)'; this.previousElementSibling.style.opacity='0.45';">
        <span style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">${formattedCount}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-supercluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
