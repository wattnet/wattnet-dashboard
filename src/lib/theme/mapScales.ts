import { COLORS } from './colors';

export const CARBON_FOOTPRINT_STOPS = {
  mapValues: [0, 100, 200, 300, 400, 500, 600, 700, 800, 1000],
  labels: [0, 200, 400, 600, 800, 1000],
  colors: [
    COLORS.carbonFootprint[0],
    COLORS.carbonFootprint[1],
    COLORS.carbonFootprint[2],
    COLORS.carbonFootprint[3],
    COLORS.carbonFootprint[4],
    COLORS.carbonFootprint[5],
    COLORS.carbonFootprint[6],
    COLORS.carbonFootprint[7],
    COLORS.carbonFootprint[8],
    COLORS.carbonFootprint[9],
  ],
};

export const WATER_FOOTPRINT_STOPS = {
  mapValues: [0, 0.5, 1, 3, 7, 13, 21, 33, 45, 200],
  labels: [0, 1, 7, 21, 45, 200],
  colors: [
    COLORS.waterFootprint[0],
    COLORS.waterFootprint[1],
    COLORS.waterFootprint[2],
    COLORS.waterFootprint[3],
    COLORS.waterFootprint[4],
    COLORS.waterFootprint[5],
    COLORS.waterFootprint[6],
    COLORS.waterFootprint[7],
    COLORS.waterFootprint[8],
    COLORS.waterFootprint[9],
  ],
};

export const WATER_IMPACT_STOPS = {
  mapValues: [0, 0.5, 1, 3, 7, 13, 21, 33, 45, 200],
  labels: [0, 1, 7, 21, 45, 200],
  colors: [
    COLORS.waterImpact[0],
    COLORS.waterImpact[1],
    COLORS.waterImpact[2],
    COLORS.waterImpact[3],
    COLORS.waterImpact[4],
    COLORS.waterImpact[5],
    COLORS.waterImpact[6],
    COLORS.waterImpact[7],
    COLORS.waterImpact[8],
    COLORS.waterImpact[9],
  ],
};

export const GREEN_SCORE_STOPS = {
  mapValues: [0, 11, 20, 33, 40, 55, 60, 77, 80, 100],
  labels: [0, 20, 40, 60, 80, 100],
  colors: [
    COLORS.greenScore[0],
    COLORS.greenScore[1],
    COLORS.greenScore[2],
    COLORS.greenScore[3],
    COLORS.greenScore[4],
    COLORS.greenScore[5],
    COLORS.greenScore[6],
    COLORS.greenScore[7],
    COLORS.greenScore[8],
    COLORS.greenScore[9],
  ],
};

// Colors that match the 6 label positions — used by the Legend gradient bar
export const CARBON_FOOTPRINT_LEGEND_COLORS = [
  COLORS.carbonFootprint[0],
  COLORS.carbonFootprint[2],
  COLORS.carbonFootprint[4],
  COLORS.carbonFootprint[6],
  COLORS.carbonFootprint[7],
  COLORS.carbonFootprint[9],
];

export const WATER_FOOTPRINT_LEGEND_COLORS = [
  COLORS.waterFootprint[0],
  COLORS.waterFootprint[2],
  COLORS.waterFootprint[4],
  COLORS.waterFootprint[6],
  COLORS.waterFootprint[7],
  COLORS.waterFootprint[9],
];

export const WATER_IMPACT_LEGEND_COLORS = [
  COLORS.waterImpact[0],
  COLORS.waterImpact[2],
  COLORS.waterImpact[4],
  COLORS.waterImpact[6],
  COLORS.waterImpact[7],
  COLORS.waterImpact[9],
];

export const GREEN_SCORE_LEGEND_COLORS = [
  COLORS.greenScore[0],
  COLORS.greenScore[2],
  COLORS.greenScore[4],
  COLORS.greenScore[6],
  COLORS.greenScore[7],
  COLORS.greenScore[9],
];

export type MetricKey = 'footprint' | 'impact' | 'green-score';
export type DimensionKey = 'carbon' | 'water';

interface ScaleConfig {
  stops: typeof CARBON_FOOTPRINT_STOPS;
  legendColors: string[];
  title: string;
  unit?: string;
}

export function getScaleConfig(
  metric: MetricKey,
  dimension: DimensionKey,
): ScaleConfig {
  if (metric === 'green-score') {
    return {
      stops: GREEN_SCORE_STOPS,
      legendColors: GREEN_SCORE_LEGEND_COLORS,
      title: 'Green Score',
    };
  }
  if (metric === 'impact') {
    return {
      stops: WATER_IMPACT_STOPS,
      legendColors: WATER_IMPACT_LEGEND_COLORS,
      title: 'Water Impact',
      unit: 'stress-L/kWh',
    };
  }
  return dimension === 'carbon'
    ? {
        stops: CARBON_FOOTPRINT_STOPS,
        legendColors: CARBON_FOOTPRINT_LEGEND_COLORS,
        title: 'Carbon Footprint',
        unit: 'gCO₂eq/kWh',
      }
    : {
        stops: WATER_FOOTPRINT_STOPS,
        legendColors: WATER_FOOTPRINT_LEGEND_COLORS,
        title: 'Water Footprint',
        unit: 'L/kWh',
      };
}
