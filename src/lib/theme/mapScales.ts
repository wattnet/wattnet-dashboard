import { COLORS } from './colors';

export const CARBON_STOPS = {
  mapValues: [0, 8, 16, 32, 64, 128, 256, 320, 512, 1000],
  labels: [0, 16, 64, 256, 512, 1000],
  colors: [
    COLORS.carbon[0],
    COLORS.carbon[1],
    COLORS.carbon[2],
    COLORS.carbon[3],
    COLORS.carbon[4],
    COLORS.carbon[5],
    COLORS.carbon[6],
    COLORS.carbon[7],
    COLORS.carbon[8],
    COLORS.carbon[9],
  ],
};

export const WATER_STOPS = {
  mapValues: [0, 0.5, 1, 3, 7, 13, 21, 33, 45, 60],
  labels: [0, 1, 7, 21, 45, 60],
  colors: [
    COLORS.water[0],
    COLORS.water[1],
    COLORS.water[2],
    COLORS.water[3],
    COLORS.water[4],
    COLORS.water[5],
    COLORS.water[6],
    COLORS.water[7],
    COLORS.water[8],
    COLORS.water[9],
  ],
};

// Colors that match the 6 label positions — used by the Legend gradient bar
export const CARBON_LEGEND_COLORS = [
  COLORS.carbon[0],
  COLORS.carbon[2],
  COLORS.carbon[4],
  COLORS.carbon[6],
  COLORS.carbon[7],
  COLORS.carbon[9],
];

export const WATER_LEGEND_COLORS = [
  COLORS.water[0],
  COLORS.water[2],
  COLORS.water[4],
  COLORS.water[6],
  COLORS.water[7],
  COLORS.water[9],
];
