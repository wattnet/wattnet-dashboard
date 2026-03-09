import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { COLORS } from '../lib/theme/colors';
import { normalizeToUTCDate } from '../utils/dateManager';

export function useMapLayers(
  map: maplibregl.Map | null,
  selectedDate: Date,
  onZoneClick?: (zoneName: string) => void,
) {
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!map) return;

    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    });

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
    const borderId = `${config.id}-borders`;
    const otherId = isCarbon ? 'water' : 'carbon';

    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'fill-color', [
        'case',
        ['==', ['get', config.property], null],
        COLORS.map['noData'],
        [
          'interpolate',
          ['linear'],
          ['get', config.property],
          ...config.stops.flatMap((stop) => [
            stop,
            (config.colors as any)[stop],
          ]),
        ],
      ]);
    } else {
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: 'world',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', config.property], null],
            COLORS.map['noData'],
            [
              'interpolate',
              ['linear'],
              ['get', config.property],
              ...config.stops.flatMap((stop) => [
                stop,
                (config.colors as any)[stop],
              ]),
            ],
          ],
          'fill-opacity': 0.8,
        },
      });

      map.addLayer({
        id: borderId,
        type: 'line',
        source: 'world',
        paint: {
          'line-color': COLORS.map['border'],
          'line-width': 0.2,
          'line-opacity': 0.9,
        },
      });

      setupHoverEffect(layerId, type as 'carbon' | 'water');
    }

    if (map.getLayer(`${otherId}-fill`)) map.removeLayer(`${otherId}-fill`);
    if (map.getLayer(`${otherId}-borders`))
      map.removeLayer(`${otherId}-borders`);
  };

  const updateMapData = (geojson: FeatureCollection, type: string) => {
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('world') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(geojson);
      renderLayers(type);
    }
  };

  const setupHoverEffect = (layerId: string, type: 'carbon' | 'water') => {
    if (!map) return;

    map.on('click', layerId, (e) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties;
      const zoneFullName = props.countryName ?? 'Unknown';

      if (onZoneClick) {
        console.log(`Zone clicked: ${zoneFullName}`);
        onZoneClick(zoneFullName);
      }
    });

    map.on('mousemove', layerId, (e) => {
      if (!e.features?.length || !popupRef.current) return;

      const props = e.features[0].properties;
      const zoneFullName = props.countryName ?? 'Unknown';

      const value = type === 'carbon' ? props.carbon_value : props.water_value;
      const unit = type === 'carbon' ? 'gCO₂eq/kWh' : 'l/kWh';
      const label = type === 'carbon' ? 'Carbon Intensity' : 'Water Footprint';
      const zoneStatus = props.zone_status;
      const valid = props.valid;

      popupRef.current
        .setLngLat(e.lngLat)
        .setHTML(
          `
                  <div style="min-width:160px">
                    <div style="font-size:12px;color:#666">${
                      normalizeToUTCDate(selectedDate) ?? '--:--'
                    }</div>
                    <strong>${zoneFullName}</strong><br/>
                    <span style="font-size:20px;font-weight:600">
                      ${value ?? '—'}
                    </span> ${unit}
                    <div style="font-size:12px;color:#666">${label}</div>
                    <div style="font-size:12px;color:#666">Zone Status = ${zoneStatus}</div>
                    <div style="font-size:12px;color:#666">${
                      valid ? 'Valid' : 'Invalid'
                    }</div>
                  </div>
                `,
        )
        .addTo(map);

      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', layerId, () => {
      popupRef.current?.remove();
      map.getCanvas().style.cursor = '';
    });
  };

  return { updateMapData };
}
