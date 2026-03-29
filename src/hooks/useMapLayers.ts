import { useCallback, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import {
  ZoneData,
  useMapControls,
  useFlowTracing,
  useZonePanel,
} from '../components/features/sidebar/context/DashboardContext';
import { CARBON_STOPS, WATER_STOPS } from '../lib/theme/mapScales';

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
      background: rgba(10,16,28,0.85);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      font-family: "Red Hat Text", system-ui, sans-serif;
      overflow: hidden;
      min-width: 360px;
    }
    .wn-popup .maplibregl-popup-tip { display: none; }

    .wn-inner { display: flex; align-items: stretch; }

    .wn-left {
      flex: 1; min-width: 0; padding: 14px 16px;
      border-right: 1px solid rgba(255,255,255,0.07);
      display: flex; flex-direction: column; gap: 5px;
    }
    .wn-date  { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.3); letter-spacing: 0.03em; line-height: 1; }
    .wn-zone  { font-size: 18px; font-weight: 600; color: rgba(255,255,255,0.92); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; margin-bottom: 5px; }
    .wn-value-row { display: flex; align-items: baseline; gap: 5px; }
    .wn-value { font-size: 34px; font-weight: 700; color: #94ce24; line-height: 1; }
    .wn-unit  { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.4); line-height: 1; }
    .wn-label { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1; padding-top: 7px; }

    .wn-right {
      padding: 14px 12px; display: flex; flex-direction: column;
      gap: 6px; justify-content: center; min-width: 110px;
    }

    .wn-chip {
      display: inline-flex; align-items: center; height: 24px;
      padding: 0 9px; border-radius: 99px;
      font-size: 11px; font-weight: 600; line-height: 1; white-space: nowrap;
      font-family: "Red Hat Text", system-ui, sans-serif;
    }

    .wn-chip-final      { background: rgba(148,206,36,0.13); border: 1px solid rgba(148,206,36,0.35); color: #a8d84e; }
    .wn-chip-not-final  { background: rgba(239,68,68,0.13);  border: 1px solid rgba(239,68,68,0.35);  color: #f87171; }
    .wn-chip-complete   { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.3);  color: #34d399; }
    .wn-chip-preview    { background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.3);  color: #fbbf24; }
    .wn-chip-forecasted { background: rgba(139,92,246,0.12); border: 1px dashed rgba(139,92,246,0.4); color: #a78bfa; }
    .wn-chip-missing    { background: rgba(239,68,68,0.08);  border: 1px solid rgba(239,68,68,0.22);  color: rgba(248,113,113,0.7); }
    .wn-chip-neutral    { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.38); }
    .wn-chip-lifecycle  { background: rgba(56,189,248,0.1);   border: 1px solid rgba(56,189,248,0.25); color: #7dd3fc; }
    .wn-chip-operational{ background: rgba(99,102,241,0.1);   border: 1px solid rgba(99,102,241,0.25); color: #a5b4fc; }
    .wn-chip-global     { background: rgba(148,206,36,0.09);  border: 1px solid rgba(148,206,36,0.25); color: rgba(148,206,36,0.85); }
    .wn-chip-local      { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);  color: rgba(255,255,255,0.4); }
  `;
  document.head.appendChild(style);
}

function isTouchDevice(): boolean {
  return globalThis.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

function formatDatetime(date: Date, timeIndex: number): string {
  const hours = Math.floor(timeIndex / 4);
  const minutes = (timeIndex % 4) * 15;
  const d = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
    ),
  );
  const datePart = d.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} · ${timePart} UTC`;
}

function calcIsForecast(date: Date, timeIndex: number): boolean {
  const hours = Math.floor(timeIndex / 4);
  const minutes = (timeIndex % 4) * 15;
  const selected = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
    ),
  );
  return selected.getTime() > Date.now();
}

interface ChipDef {
  label: string;
  cls: string;
}

function chipHTML({ label, cls }: ChipDef): string {
  return `<span class="wn-chip ${cls}">${label}</span>`;
}

function buildPopupChips(
  data: ZoneData,
  scope: string,
  flowTracing: boolean,
): ChipDef[] {
  const chips: ChipDef[] = [];

  chips.push(
    data.valid
      ? { label: 'Final', cls: 'wn-chip-final' }
      : { label: 'Not Final', cls: 'wn-chip-not-final' },
  );

  const raw = data.zoneStatus ?? '';
  if (raw === 'complete')
    chips.push({ label: 'Complete', cls: 'wn-chip-complete' });
  else if (raw === 'preview')
    chips.push({ label: 'Preview', cls: 'wn-chip-preview' });
  else if (raw === 'missing' && data.isForecast)
    chips.push({ label: 'Forecasted', cls: 'wn-chip-forecasted' });
  else if (raw === 'missing')
    chips.push({ label: 'Missing', cls: 'wn-chip-missing' });
  else if (raw) chips.push({ label: raw, cls: 'wn-chip-neutral' });

  chips.push(
    scope === 'life-cycle'
      ? { label: 'Life-cycle', cls: 'wn-chip-lifecycle' }
      : { label: 'Operational', cls: 'wn-chip-operational' },
  );

  chips.push(
    flowTracing
      ? { label: 'Global', cls: 'wn-chip-global' }
      : { label: 'Local', cls: 'wn-chip-local' },
  );

  return chips;
}

function buildHTML(data: ZoneData, datetime: string, chips: ChipDef[]): string {
  const valStr = data.value != null ? data.value.toFixed(2) : '—';
  return `
    <div class="wn-inner">
      <div class="wn-left">
        <div class="wn-date">${datetime}</div>
        <div class="wn-zone">${data.zoneName}</div>
        <div class="wn-value-row">
          <span class="wn-value">${valStr}</span>
          <span class="wn-unit">${data.unit}</span>
        </div>
        <div class="wn-label">${data.label}</div>
      </div>
      <div class="wn-right">
        ${chips.map(chipHTML).join('\n        ')}
      </div>
    </div>
  `;
}

export function useMapLayers(
  map: maplibregl.Map | null,
  selectedDate: Date,
  onZoneClick?: (zoneName: string, data: ZoneData) => void,
  selectedTimeIndex = 0,
) {
  const { scope } = useMapControls();
  const { flowTracing } = useFlowTracing();
  const { zonePanelOpen, updateZoneData } = useZonePanel();

  const popupRef = useRef<maplibregl.Popup | null>(null);
  const isTouch = useRef(false);
  // Stores the raw GeoJSON props + type of the last clicked zone
  const lastClickRef = useRef<{
    props: ZoneFeatureProperties;
    type: 'carbon' | 'water';
  } | null>(null);

  const scopeRef = useRef(scope);
  const flowTracingRef = useRef(flowTracing);
  const timeIndexRef = useRef(selectedTimeIndex);
  const dateRef = useRef(selectedDate);
  const zonePanelOpenRef = useRef(zonePanelOpen);

  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);
  useEffect(() => {
    flowTracingRef.current = flowTracing;
  }, [flowTracing]);
  useEffect(() => {
    timeIndexRef.current = selectedTimeIndex;
  }, [selectedTimeIndex]);
  useEffect(() => {
    dateRef.current = selectedDate;
  }, [selectedDate]);
  useEffect(() => {
    zonePanelOpenRef.current = zonePanelOpen;
  }, [zonePanelOpen]);

  useEffect(() => {
    if (!map) return;
    injectPopupStyles();
    isTouch.current = isTouchDevice();
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

  const buildZoneData = useCallback(
    (props: ZoneFeatureProperties, type: 'carbon' | 'water'): ZoneData => {
      const isCarbon = type === 'carbon';
      const rawValue = isCarbon ? props.carbon_value : props.water_value;
      const forecast = calcIsForecast(dateRef.current, timeIndexRef.current);
      return {
        zoneName: props.countryName ?? 'Unknown',
        value: rawValue == null ? null : Number(rawValue),
        unit: isCarbon ? 'gCO₂eq/kWh' : 'l/kWh',
        label: isCarbon ? 'Carbon Footprint' : 'Water Footprint',
        zoneStatus: props.zone_status,
        valid: props.valid,
        date: formatDatetime(dateRef.current, timeIndexRef.current),
        isForecast: forecast,
      };
    },
    [],
  );

  // ── Refresh panel when date/time changes while a zone is open ─────────────
  useEffect(() => {
    if (!zonePanelOpen || !lastClickRef.current) return;
    const { props, type } = lastClickRef.current;
    updateZoneData(buildZoneData(props, type));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedTimeIndex, zonePanelOpen]);

  const renderLayers = useCallback(
    (type: string) => {
      if (!map) return;
      const isCarbon = type === 'carbon';
      const stops = isCarbon ? CARBON_STOPS : WATER_STOPS;
      const property = isCarbon ? 'carbon_value' : 'water_value';
      const layerId = isCarbon ? 'carbon-fill' : 'water-fill';
      const otherId = isCarbon ? 'water-fill' : 'carbon-fill';

      const fillColorExpr = [
        'case',
        ['==', ['get', property], null],
        '#1a2a45',
        [
          'interpolate',
          ['linear'],
          ['get', property],
          ...stops.mapValues.flatMap((v, i) => [v, stops.colors[i]]),
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
            'fill-color': fillColorExpr as maplibregl.ExpressionSpecification,
            'fill-opacity': 0.85,
            'fill-outline-color': 'rgba(180,210,255,0.28)',
          },
        });
        setupInteractions(layerId, type as 'carbon' | 'water');
      }
      if (map.getLayer(otherId)) map.removeLayer(otherId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [map],
  );

  const updateMapData = useCallback(
    (geojson: FeatureCollection, type: string) => {
      if (!map) return;
      const source = map.getSource('world') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(geojson);
        renderLayers(type);
      }
    },
    [map, renderLayers],
  );

  const setupInteractions = useCallback(
    (layerId: string, type: 'carbon' | 'water') => {
      if (!map) return;

      map.on('click', layerId, (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as ZoneFeatureProperties;
        // Store for panel refresh
        lastClickRef.current = { props, type };
        const data = buildZoneData(props, type);
        onZoneClick?.(data.zoneName, data);
      });

      if (!isTouch.current) {
        map.on('mousemove', layerId, (e) => {
          if (!e.features?.length || !popupRef.current) return;
          const props = e.features[0].properties as ZoneFeatureProperties;
          const data = buildZoneData(props, type);
          const datetime = formatDatetime(
            dateRef.current,
            timeIndexRef.current,
          );
          const chips = buildPopupChips(
            data,
            scopeRef.current,
            flowTracingRef.current,
          );
          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(buildHTML(data, datetime, chips))
            .addTo(map);
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          popupRef.current?.remove();
          map.getCanvas().style.cursor = '';
        });
      } else {
        map.on('mousemove', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }
    },
    [map, buildZoneData, onZoneClick],
  );

  return { updateMapData };
}
