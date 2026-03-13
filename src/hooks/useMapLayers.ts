import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { COLORS } from '../lib/theme/colors';
import { normalizeToUTCDate } from '../utils/dateManager';
import { ZoneData } from '../components/features/sidebar/context/DashboardContext';

interface ZoneFeatureProperties {
  countryName?: string;
  carbon_value?: number;
  water_value?: number;
  zone_status?: string;
  valid?: boolean;
  [key: string]: unknown;
}

function injectPopupStyles() {
  if (document.getElementById('wn-popup-style')) return;
  const style = document.createElement('style');
  style.id = 'wn-popup-style';
  style.textContent = `
    .wn-popup .maplibregl-popup-content {
      background: rgba(11,18,30,0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 10px 14px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
      color: #fff;
      font-family: system-ui, sans-serif;
      min-width: 160px;
    }
    .wn-popup .maplibregl-popup-tip { display: none; }
    .wn-popup-zone  { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 6px; }
    .wn-popup-value { font-size: 22px; font-weight: 700; color: #94ce24; line-height: 1; }
    .wn-popup-unit  { font-size: 11px; color: rgba(255,255,255,0.4); margin-left: 3px; }
    .wn-popup-label { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 4px; }
    .wn-popup-date  { font-size: 10px; color: rgba(255,255,255,0.22); margin-bottom: 5px; }
    .wn-popup-meta  { font-size: 10px; color: rgba(255,255,255,0.2); margin-top: 3px; }
  `;
  document.head.appendChild(style);
}

// True if the primary input is touch (no hover capability)
function isTouchDevice(): boolean {
  return globalThis.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

export function useMapLayers(
  map: maplibregl.Map | null,
  selectedDate: Date,
  onZoneClick?: (zoneName: string, data: ZoneData) => void,
) {
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const isTouch = useRef(false);

  useEffect(() => {
    if (!map) return;
    injectPopupStyles();
    isTouch.current = isTouchDevice();

    // Only create popup on non-touch devices
    if (!isTouch.current) {
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
        className: 'wn-popup',
      });
    }

    return () => {
      popupRef.current?.remove();
    };
  }, [map]);

  const renderLayers = (type: string) => {
    if (!map) return;

    const isCarbon = type === 'carbon';
    const config = {
      id: isCarbon ? 'carbon' : 'water',
      property: isCarbon ? 'carbon_value' : 'water_value',
      colors: isCarbon ? COLORS.carbon : COLORS.water,
      stops: isCarbon
        ? [0, 50, 100, 200, 500, 1000]
        : [0, 50, 100, 150, 200, 250],
    };

    const layerId = `${config.id}-fill`;
    const otherId = isCarbon ? 'water' : 'carbon';

    const fillColorExpr = [
      'case',
      ['==', ['get', config.property], null],
      '#1a2a45',
      [
        'interpolate',
        ['linear'],
        ['get', config.property],
        ...config.stops.flatMap((stop) => [
          stop,
          (config.colors as Record<number, string>)[stop],
        ]),
      ],
    ];

    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'fill-color', fillColorExpr);
    } else {
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: 'world',
        paint: {
          'fill-color': fillColorExpr,
          'fill-opacity': 0.85,
          'fill-outline-color': 'rgba(180,210,255,0.28)',
        },
      });

      setupInteractions(layerId, type as 'carbon' | 'water');
    }

    if (map.getLayer(`${otherId}-fill`)) map.removeLayer(`${otherId}-fill`);
  };

  const updateMapData = (geojson: FeatureCollection, type: string) => {
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource('world') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(geojson);
      renderLayers(type);
    }
  };

  const buildZoneData = (
    props: ZoneFeatureProperties,
    type: 'carbon' | 'water',
  ): ZoneData => {
    const isCarbon = type === 'carbon';
    const rawValue = isCarbon ? props.carbon_value : props.water_value;
    return {
      zoneName: props.countryName ?? 'Unknown',
      value: rawValue === null || rawValue === undefined ? null : Number(rawValue),
      unit: isCarbon ? 'gCO₂eq/kWh' : 'l/kWh',
      label: isCarbon ? 'Carbon Intensity' : 'Water Footprint',
      zoneStatus: props.zone_status,
      valid: props.valid,
      date:
        normalizeToUTCDate(selectedDate)?.toISOString().split('T')[0] ?? '--',
    };
  };

  const setupInteractions = (layerId: string, type: 'carbon' | 'water') => {
    if (!map) return;

    // Click — always fires, passes ZoneData
    map.on('click', layerId, (e) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties as ZoneFeatureProperties;
      const data = buildZoneData(props, type);
      onZoneClick?.(data.zoneName, data);
    });

    // Hover popup — desktop only
    if (!isTouch.current) {
      map.on('mousemove', layerId, (e) => {
        if (!e.features?.length || !popupRef.current) return;
        const props = e.features[0].properties as ZoneFeatureProperties;
        const data = buildZoneData(props, type);
        const valStr =
          data.value === null || data.value === undefined
            ? '—'
            : data.value.toFixed(1);

        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `
            <div class="wn-popup-date">${data.date}</div>
            <div class="wn-popup-zone">${data.zoneName}</div>
            <div>
              <span class="wn-popup-value">${valStr}</span>
              <span class="wn-popup-unit">${data.unit}</span>
            </div>
            <div class="wn-popup-label">${data.label}</div>
            <div class="wn-popup-meta">Status: ${data.zoneStatus ?? '—'} · ${data.valid ? 'Valid' : 'Invalid'}</div>
          `,
          )
          .addTo(map);

        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', layerId, () => {
        popupRef.current?.remove();
        map.getCanvas().style.cursor = '';
      });
    } else {
      // Touch: just show pointer cursor on tap
      map.on('mousemove', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });
    }
  };

  return { updateMapData };
}
