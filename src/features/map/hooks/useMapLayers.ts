import { useCallback, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { FeatureCollection } from 'geojson';

import { useMapScales, MetricKey } from './useMapScales';
import {
  ZoneData,
  useMapControls,
  useFlowTracing,
  useZonePanel,
} from '../../dashboard/store/useDashboardStore';
import { useAppTheme } from '@/src/core/theme/ThemeContext';
import { ThemePalette } from '@/src/core/theme/themes';
import { ProcessedFootprint } from '../types/footprints';

interface ZoneFeatureProperties {
  zoneName?: string;
  countryName?: string;
  value?: number;
  zone_status?: string;
  valid?: boolean;
  [key: string]: unknown;
}

function injectPopupStyles(currentPalette: ThemePalette) {
  let style = document.getElementById('wn-popup-style');

  if (!style) {
    style = document.createElement('style');
    style.id = 'wn-popup-style';
    document.head.appendChild(style);
  }

  style.textContent = `
    .wn-popup .maplibregl-popup-content {
      background: color-mix(in srgb, var(--color-panel) 93%, transparent);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid color-mix(in srgb, var(--color-foreground) 10%, transparent);
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 8px 32px color-mix(in srgb, var(--color-background) 3s0%, transparent);
      font-family: "Red Hat Text", system-ui, sans-serif;
      overflow: hidden;
      width: max-content;
    }
    .wn-popup .maplibregl-popup-tip { display: none; }

    .wn-inner { display: flex; align-items: stretch; }

    .wn-left {
      flex: 1; min-width: 0; padding: 14px 16px;
      border-right: 1px solid ${currentPalette.colors.border};
      display: flex; flex-direction: column; gap: 5px;
    }
    .wn-date  { font-size: 14px; font-weight: 500; color: color-mix(in srgb, var(--color-foreground) 30%, transparent); letter-spacing: 0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .wn-zone  { display: flex; align-items: baseline; gap: 5px; line-height: 1.2; margin-bottom: 5px; overflow: hidden; }
    .wn-zone-name { font-size: 18px; font-weight: 600; color: color-mix(in srgb, var(--color-foreground) 92%, transparent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
    .wn-zone-code { font-size: 12px; font-weight: 500; color: color-mix(in srgb, var(--color-foreground) 45%, transparent); letter-spacing: 0.04em; white-space: nowrap; flex-shrink: 0; }
    .wn-value-row { display: flex; align-items: baseline; gap: 6px; }
    .wn-value { font-size: 34px; font-weight: 700; color:color-mix(in srgb, var(--color-foreground) 92%, transparent); line-height: 1; font-variant-numeric: tabular-nums; }
    .wn-unit  { font-size: 14px; font-weight: 500; color: color-mix(in srgb, var(--color-foreground) 40%, transparent); line-height: 1;}
    .wn-label { font-size: 15px; color:color-mix(in srgb, var(--color-foreground) 50%, transparent); line-height: 1; padding-top: 7px; }

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

    .wn-chip-final      { background: color-mix(in srgb, ${currentPalette.chipColors.final} 13%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.final} 35%, transparent); color: ${currentPalette.chipColors.final}; }
    .wn-chip-not-final  { background: color-mix(in srgb, ${currentPalette.chipColors.notFinal} 13%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.notFinal} 35%, transparent); color: ${currentPalette.chipColors.notFinal}; }
    .wn-chip-complete   { background: color-mix(in srgb, ${currentPalette.chipColors.complete} 12%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.complete} 30%, transparent); color: ${currentPalette.chipColors.complete}; }
    .wn-chip-preview    { background: color-mix(in srgb, ${currentPalette.chipColors.preview} 12%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.preview} 30%, transparent); color: ${currentPalette.chipColors.preview}; }
    .wn-chip-forecasted { background: color-mix(in srgb, ${currentPalette.chipColors.forecasted} 12%, transparent); border: 1px dashed color-mix(in srgb, ${currentPalette.chipColors.forecasted} 40%, transparent); color: ${currentPalette.chipColors.forecasted}; }
    .wn-chip-missing    { background: color-mix(in srgb, ${currentPalette.chipColors.missing} 8%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.missing} 22%, transparent); color: color-mix(in srgb, ${currentPalette.chipColors.missing} 70%, transparent); }
    .wn-chip-neutral    { background: color-mix(in srgb, ${currentPalette.chipColors.neutral} 5%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.neutral} 10%, transparent); color: color-mix(in srgb, ${currentPalette.chipColors.neutral} 38%, transparent); }
    .wn-chip-lifecycle  { background: color-mix(in srgb, ${currentPalette.chipColors.lifecycle} 10%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.lifecycle} 25%, transparent); color: ${currentPalette.chipColors.lifecycle}; }
    .wn-chip-operational{ background: color-mix(in srgb, ${currentPalette.chipColors.operational} 10%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.operational} 25%, transparent); color: ${currentPalette.chipColors.operational}; }
    .wn-chip-global     { background: color-mix(in srgb, ${currentPalette.chipColors.global} 9%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.global} 25%, transparent); color: color-mix(in srgb, ${currentPalette.chipColors.global} 85%, transparent); }
    .wn-chip-local      { background: color-mix(in srgb, ${currentPalette.chipColors.local} 13%, transparent); border: 1px solid color-mix(in srgb, ${currentPalette.chipColors.local} 35%, transparent); color: ${currentPalette.chipColors.local}; }
  `;
}

function isTouchDevice(): boolean {
  return globalThis.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

function formatDatetime(date: Date, timeIndex: number): string {
  const slot = timeIndex % 96;
  const hours = Math.floor(slot / 4);
  const minutes = (slot % 4) * 15;
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
  const slot = timeIndex % 96;
  const hours = Math.floor(slot / 4);
  const minutes = (slot % 4) * 15;
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
        <div class="wn-zone"><span class="wn-zone-name">${data.zoneName}</span>${data.zoneCode ? `<span class="wn-zone-code">(${data.zoneCode})</span>` : ''}</div>
        <div class="wn-value-row">
          <span class="wn-value">${valStr}</span>
          ${data.unit ? `<span class="wn-unit">${data.unit}</span>` : ''}
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
  metric: MetricKey,
  onZoneClick?: (zoneName: string, data: ZoneData) => void,
  selectedTimeIndex = 0,
  processedData: ProcessedFootprint[] = [],
) {
  const { currentPalette } = useAppTheme();

  const { scope, dimension } = useMapControls();
  const { flowTracing } = useFlowTracing();
  const { zonePanelOpen, updateZoneData } = useZonePanel();

  const scaleConfig = useMapScales(metric, dimension);

  const popupRef = useRef<maplibregl.Popup | null>(null);
  const isTouch = useRef(false);
  const lastClickRef = useRef<{
    props: ZoneFeatureProperties;
    type: 'carbon' | 'water';
  } | null>(null);
  const lastHoverRef = useRef<{
    props: ZoneFeatureProperties;
    type: 'carbon' | 'water';
  } | null>(null);
  const processedDataRef = useRef(processedData);
  processedDataRef.current = processedData;

  const scaleConfigRef = useRef(scaleConfig);
  useEffect(() => {
    scaleConfigRef.current = scaleConfig;
  }, [scaleConfig]);

  const metricRef = useRef(metric);
  const scopeRef = useRef(scope);
  const flowTracingRef = useRef(flowTracing);
  const timeIndexRef = useRef(selectedTimeIndex);
  const dateRef = useRef(selectedDate);
  const zonePanelOpenRef = useRef(zonePanelOpen);

  useEffect(() => {
    metricRef.current = metric;
  }, [metric]);
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
    injectPopupStyles(currentPalette);
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
  }, [map, currentPalette]);

  const buildZoneData = useCallback(
    (props: ZoneFeatureProperties, _type: string): ZoneData => {
      const fp = processedDataRef.current.find(
        (d) => d.zone === props.zoneName,
      );
      const currentItem = fp?.series[timeIndexRef.current];
      const forecast = calcIsForecast(dateRef.current, timeIndexRef.current);

      return {
        zoneName: props.countryName ?? 'Unknown',
        zoneCode: props.zoneName ?? '',
        value: currentItem?.value ?? null,
        unit: scaleConfigRef.current.unit ?? '',
        label: scaleConfigRef.current.title,
        zoneStatus: currentItem?.zoneStatus ?? props.zone_status ?? 'missing',
        valid: currentItem?.valid ?? props.valid ?? false,
        date: formatDatetime(dateRef.current, timeIndexRef.current),
        isForecast: forecast,
      };
    },
    [],
  );

  useEffect(() => {
    if (!zonePanelOpen || !lastClickRef.current) return;
    const { props, type } = lastClickRef.current;
    updateZoneData(buildZoneData(props, type));
  }, [selectedDate, selectedTimeIndex, zonePanelOpen, processedData]);

  useEffect(() => {
    if (!lastHoverRef.current || !popupRef.current?.isOpen()) return;
    const { props, type } = lastHoverRef.current;
    const data = buildZoneData(props, type);
    const datetime = formatDatetime(dateRef.current, timeIndexRef.current);
    const chips = buildPopupChips(
      data,
      scopeRef.current,
      flowTracingRef.current,
    );
    popupRef.current.setHTML(buildHTML(data, datetime, chips));
  }, [selectedTimeIndex, selectedDate, buildZoneData]);

  const renderLayers = useCallback(
    (type: string) => {
      if (!map) return;
      const isCarbon = type === 'carbon';
      const { stops } = scaleConfig;
      const property = 'value';
      const layerId = isCarbon ? 'carbon-fill' : 'water-fill';
      const otherId = isCarbon ? 'water-fill' : 'carbon-fill';

      const fillColorExpr = [
        'case',
        ['==', ['get', property], null],
        currentPalette.mapScales.noData,
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
    },
    [map, scaleConfig],
  );

  useEffect(() => {
    if (map && map.getSource('world')) {
      renderLayers(dimension);
    }
  }, [scaleConfig, dimension, map, renderLayers]);

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
        lastClickRef.current = { props, type };
        const data = buildZoneData(props, type);
        onZoneClick?.(data.zoneName, data);
      });

      if (!isTouch.current) {
        map.on('mousemove', layerId, (e) => {
          if (!e.features?.length || !popupRef.current) return;
          const props = e.features[0].properties as ZoneFeatureProperties;
          lastHoverRef.current = { props, type };
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
          lastHoverRef.current = null;
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
