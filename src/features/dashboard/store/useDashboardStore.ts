import { create } from 'zustand';
import { DimensionKey, MetricKey } from '@/src/features/map/utils/mapScales';
import { useShallow } from 'zustand/react/shallow';

export type BottomSheetState = 'hidden' | 'full';

export interface CanvasRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ZoneData {
  zoneName: string;
  zoneCode?: string;
  value: number | null;
  unit: string;
  label: string;
  zoneStatus?: string;
  valid?: boolean;
  date?: string;
  isForecast?: boolean;
}

export interface ZoneSeriesPoint {
  value: number | null;
  timestamp: string;
}

interface DashboardState {
  // State
  metric: MetricKey;
  dimension: DimensionKey;
  scope: string;
  flowTracing: boolean;
  zonePanelOpen: boolean;
  selectedZone: string | undefined;
  zoneData: ZoneData | null;
  openCount: number;
  sidebarCollapsed: boolean;
  bottomSheetState: BottomSheetState;
  canvasRect: CanvasRect;
  zoneSeries: ZoneSeriesPoint[] | null;
  zoneSeriesIndex: number;
  initialDataReady: boolean;

  // Simple actions (setters)
  setMetric: (v: MetricKey) => void;
  setDimension: (v: DimensionKey) => void;
  setScope: (v: string) => void;
  setFlowTracing: (v: boolean) => void;
  setBottomSheetState: (v: BottomSheetState) => void;
  setCanvasRect: (rect: CanvasRect) => void;
  setZoneSeries: (series: ZoneSeriesPoint[] | null) => void;
  setZoneSeriesIndex: (index: number) => void;
  setInitialDataReady: () => void;

  // Complex actions
  openZonePanel: (zoneName: string, data?: ZoneData) => void;
  updateZoneData: (data: ZoneData) => void;
  closeZonePanel: () => void;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
}

// --- STORE CREATION ---
export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial values
  metric: 'footprint',
  dimension: 'carbon',
  scope: 'life-cycle',
  flowTracing: true,
  zonePanelOpen: false,
  selectedZone: undefined,
  zoneData: null,
  openCount: 0,
  sidebarCollapsed: false,
  bottomSheetState: 'hidden',
  canvasRect: { top: 0, left: 0, width: 0, height: 0 },
  zoneSeries: null,
  zoneSeriesIndex: 0,
  initialDataReady: false,

  // Setters
  setMetric: (metric) => set({ metric }),
  setDimension: (dimension) => set({ dimension }),
  setScope: (scope) => set({ scope }),
  setFlowTracing: (flowTracing) => set({ flowTracing }),
  setBottomSheetState: (bottomSheetState) => set({ bottomSheetState }),
  setCanvasRect: (canvasRect) => set({ canvasRect }),
  setZoneSeries: (zoneSeries) => set({ zoneSeries }),
  setZoneSeriesIndex: (zoneSeriesIndex) => set({ zoneSeriesIndex }),
  setInitialDataReady: () => set({ initialDataReady: true }),

  // Complex actions
  openZonePanel: (zoneName, data) =>
    set((state) => ({
      selectedZone: zoneName,
      zoneData: data ?? state.zoneData,
      zonePanelOpen: true,
      openCount: state.openCount + 1,
    })),

  updateZoneData: (data) => set({ zoneData: data }),

  closeZonePanel: () => {
    set({ zonePanelOpen: false, zoneSeries: null, zoneSeriesIndex: 0 });
    setTimeout(() => {
      set({ selectedZone: undefined, zoneData: null });
    }, 500);
  },

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  collapseSidebar: () => set({ sidebarCollapsed: true }),
  expandSidebar: () => set({ sidebarCollapsed: false }),
}));

// --- HOOKS ---
export function useMapControls() {
  return useDashboardStore(
    useShallow((state) => ({
      metric: state.metric,
      setMetric: state.setMetric,
      dimension: state.dimension,
      setDimension: state.setDimension,
      scope: state.scope,
      setScope: state.setScope,
    })),
  );
}

export function useFlowTracing() {
  return useDashboardStore(
    useShallow((state) => ({
      flowTracing: state.flowTracing,
      setFlowTracing: state.setFlowTracing,
    })),
  );
}

export function useZonePanel() {
  return useDashboardStore(
    useShallow((state) => ({
      zonePanelOpen: state.zonePanelOpen,
      selectedZone: state.selectedZone,
      zoneData: state.zoneData,
      openCount: state.openCount,
      openZonePanel: state.openZonePanel,
      updateZoneData: state.updateZoneData,
      closeZonePanel: state.closeZonePanel,
    })),
  );
}

export function useZoneChart() {
  return useDashboardStore(
    useShallow((state) => ({
      zoneSeries: state.zoneSeries,
      zoneSeriesIndex: state.zoneSeriesIndex,
    })),
  );
}

export function useSidebar() {
  return useDashboardStore(
    useShallow((state) => ({
      sidebarCollapsed: state.sidebarCollapsed,
      toggleSidebar: state.toggleSidebar,
      collapseSidebar: state.collapseSidebar,
      expandSidebar: state.expandSidebar,
    })),
  );
}

export function useBottomSheet() {
  return useDashboardStore(
    useShallow((state) => ({
      bottomSheetState: state.bottomSheetState,
      setBottomSheetState: state.setBottomSheetState,
    })),
  );
}

export function useCanvasRect() {
  return useDashboardStore(
    useShallow((state) => ({
      canvasRect: state.canvasRect,
      setCanvasRect: state.setCanvasRect,
    })),
  );
}
