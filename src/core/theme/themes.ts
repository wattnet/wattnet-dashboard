export interface ThemePalette {
  mode: 'dark' | 'light';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    panelBg: string;
    text: string;
    textDim: string;
    border: string;
  };
  mapScales: {
    carbonFootprint: string[];
    waterFootprint: string[];
    waterImpact: string[];
    greenScore: string[];
    noData: string;
    mapBorder: string;
  };
  chipColors: {
    final: string;
    notFinal: string;
    complete: string;
    preview: string;
    forecasted: string;
    missing: string;
    neutral: string;
    lifecycle: string;
    operational: string;
    global: string;
    local: string;
  };
}

const BASE_MAP_SCALES = {
  carbonFootprint: [
    '#7DD438',
    '#BDD12A',
    '#F1DE30',
    '#FFCE1B',
    '#FAAA16',
    '#E86100',
    '#B84D00',
    '#995307',
    '#6D3B07',
    '#2E1C0E',
  ],
  waterFootprint: [
    '#E0F3FF',
    '#B3E0FF',
    '#80CCFF',
    '#4DB8FF',
    '#1AA3FF',
    '#0080E0',
    '#0059B3',
    '#004080',
    '#00264D',
    '#001233',
  ],
  waterImpact: [
    '#E0F7FF',
    '#B3ECFF',
    '#80E0FF',
    '#4DD2FF',
    '#1AC6FF',
    '#0099CC',
    '#336699',
    '#4B4B8F',
    '#3A2F66',
    '#241A3D',
  ],
  greenScore: [
    '#C41E3Aff',
    '#D42E3Eff',
    '#E23E42ff',
    '#EF5350ff',
    '#F57C5Eff',
    '#FB8C45ff',
    '#FFB347ff',
    '#B8B84Dff',
    '#7FB53Fff',
    '#4CAF50ff',
  ],
};

const COLORBLIND_MAP_SCALES = {
  carbonFootprint: [
    '#F9FE7F',
    '#FCA338',
    '#ED6925',
    '#CC4678',
    '#9B179F',
    '#6800A8',
    '#420A68',
    '#210C4A',
    '#0D0829',
    '#000004',
  ],
  waterFootprint: [
    '#E0F3FF',
    '#BBE0FE',
    '#8CBFF9',
    '#63A2F0',
    '#4285E4',
    '#2765CC',
    '#1347A8',
    '#072E80',
    '#021854',
    '#000829',
  ],
  waterImpact: [
    '#D1FDFE',
    '#9BE9F9',
    '#69D2F4',
    '#40B7EE',
    '#259AE4',
    '#2270C1',
    '#344A9D',
    '#41247A',
    '#420854',
    '#2B002E',
  ],
  greenScore: [
    '#B2182B',
    '#D6604D',
    '#F4A582',
    '#FDDBC7',
    '#F7F7F7',
    '#D1E5F0',
    '#92C5DE',
    '#4393C3',
    '#2166AC',
    '#053061',
  ],
};

export const DARK_CHIP_COLORS = {
  final: '#a8d84e',
  notFinal: '#f87171',
  complete: '#34d399',
  preview: '#fbbf24',
  forecasted: '#a78bfa',
  missing: '#f87171',
  neutral: '#ffffff',
  lifecycle: '#7dd3fc',
  operational: '#a5b4fc',
  global: '#94ce24',
  local: '#ffffff',
};

export const LIGHT_CHIP_COLORS = {
  final: '#5e9411',
  notFinal: '#dc2626',
  complete: '#059669',
  preview: '#d97706',
  forecasted: '#7c3aed',
  missing: '#dc2626',
  neutral: '#64748b',
  lifecycle: '#0284c7',
  operational: '#4f46e5',
  global: '#5e9411',
  local: '#D65687',
};

export const COLORBLIND_CHIP_COLORS = {
  final: '#0072b2',
  notFinal: '#A34800',
  complete: '#8B12DF',
  preview: '#998400',
  forecasted: '#B81D9B',
  missing: '#BD5300',
  neutral: '#64748B',
  lifecycle: '#007A8A',
  operational: '#5C5A46',
  global: '#6700B2',
  local: '#004A39',
};

export const THEMES: Record<'dark' | 'light' | 'colorblind', ThemePalette> = {
  dark: {
    mode: 'dark',
    colors: {
      primary: '#94ce24',
      secondary: '#5588e6',
      background: '#1D2A36',
      panelBg: '#0b121e',
      text: '#f8fafc',
      textDim: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(255, 255, 255, 0.08)',
    },
    mapScales: {
      ...BASE_MAP_SCALES,
      noData: '#1a2a45',
      mapBorder: '#1a1a1a',
    },
    chipColors: DARK_CHIP_COLORS,
  },
  light: {
    mode: 'light',
    colors: {
      primary: '#7bb320',
      secondary: '#3a78e0',
      background: '#EAEDF0',
      panelBg: '#ffffff',
      text: '#0f172a',
      textDim: 'rgba(0, 0, 0, 0.6)',
      border: 'rgba(0, 0, 0, 0.08)',
    },
    mapScales: {
      ...BASE_MAP_SCALES,
      noData: '#e2e8f0',
      mapBorder: '#ffffff',
    },
    chipColors: LIGHT_CHIP_COLORS,
  },
  colorblind: {
    mode: 'light',
    colors: {
      primary: '#d55e00',
      secondary: '#0072b2',
      background: '#ffffff',
      panelBg: 'rgba(255, 255, 255, 0.95)',
      text: '#000000',
      textDim: '#444444',
      border: 'rgba(0, 0, 0, 0.2)',
    },
    mapScales: {
      ...COLORBLIND_MAP_SCALES,
      noData: '#cccccc',
      mapBorder: '#ffffff',
    },
    chipColors: COLORBLIND_CHIP_COLORS,
  },
};
