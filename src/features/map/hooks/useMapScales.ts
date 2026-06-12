'use client';

import { useMemo } from 'react';
import { useAppTheme } from '@/src/core/theme/ThemeContext';

export type MetricKey = 'footprint' | 'impact' | 'green-score';
export type DimensionKey = 'carbon' | 'water';

export interface ScaleConfig {
  stops: {
    mapValues: number[];
    labels: number[];
    colors: string[];
  };
  legendColors: string[];
  title: string;
  unit?: string;
}

export function useMapScales(
  metric: MetricKey,
  dimension: DimensionKey
): ScaleConfig {
  const { currentPalette } = useAppTheme();

  return useMemo(() => {
    const scales = currentPalette.mapScales;

    const carbonValues = [0, 100, 200, 300, 400, 500, 600, 700, 800, 1000];
    const carbonLabels = [0, 200, 400, 600, 800, 1000];

    const waterValues = [0, 0.5, 1, 3, 7, 13, 21, 33, 45, 200];
    const waterLabels = [0, 1, 7, 21, 45, 200];

    const greenScoreValues = [0, 11, 20, 33, 40, 55, 60, 77, 80, 100];
    const greenScoreLabels = [0, 20, 40, 60, 80, 100];

    const getLegendColors = (colors: string[]) => [
      colors[0],
      colors[2],
      colors[4],
      colors[6],
      colors[7],
      colors[9],
    ];

    if (metric === 'green-score') {
      return {
        stops: {
          mapValues: greenScoreValues,
          labels: greenScoreLabels,
          colors: scales.greenScore,
        },
        legendColors: getLegendColors(scales.greenScore),
        title: 'Green Score',
      };
    }

    if (metric === 'impact') {
      return {
        stops: {
          mapValues: waterValues,
          labels: waterLabels,
          colors: scales.waterImpact,
        },
        legendColors: getLegendColors(scales.waterImpact),
        title: 'Water Impact',
        unit: 'stress-Liters/kWh',
      };
    }

    if (dimension === 'carbon') {
      return {
        stops: {
          mapValues: carbonValues,
          labels: carbonLabels,
          colors: scales.carbonFootprint,
        },
        legendColors: getLegendColors(scales.carbonFootprint),
        title: 'Carbon Footprint',
        unit: 'gCO₂eq/kWh',
      };
    }

    return {
      stops: {
        mapValues: waterValues,
        labels: waterLabels,
        colors: scales.waterFootprint,
      },
      legendColors: getLegendColors(scales.waterFootprint),
      title: 'Water Footprint',
      unit: 'Liters/kWh',
    };
  }, [currentPalette, metric, dimension]);
}
