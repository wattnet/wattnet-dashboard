"use client";

import React from "react";

type BottomSheetState = "hidden" | "peek" | "mid" | "full";

export interface CanvasRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ZoneData {
  zoneName: string;
  value: number | null;
  unit: string;
  label: string;
  zoneStatus?: string;
  valid?: boolean;
  date?: string;
}

interface DashboardContextType {
  footprintType: string;
  setFootprintType: (v: string) => void;
  scope: string;
  setScope: (v: string) => void;
  flowTracing: boolean;
  setFlowTracing: (v: boolean) => void;
  sidebarControls: React.ReactNode;
  setSidebarControls: React.Dispatch<React.SetStateAction<React.ReactNode>>;
  zonePanelOpen: boolean;
  selectedZone: string | undefined;
  zoneData: ZoneData | null;
  openCount: number;
  openZonePanel: (zoneName: string, data?: ZoneData) => void;
  closeZonePanel: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  bottomSheetState: BottomSheetState;
  setBottomSheetState: (v: BottomSheetState) => void;
  canvasRect: CanvasRect;
  setCanvasRect: (rect: CanvasRect) => void;
}

const DashboardContext = React.createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [footprintType, setFootprintType] = React.useState("carbon");
  const [scope, setScope] = React.useState("life-cycle");
  const [flowTracing, setFlowTracing] = React.useState(false);
  const [sidebarControls, setSidebarControls] =
    React.useState<React.ReactNode>(null);
  const [zonePanelOpen, setZonePanelOpen] = React.useState(false);
  const [selectedZone, setSelectedZone] = React.useState<string | undefined>(
    undefined,
  );
  const [zoneData, setZoneData] = React.useState<ZoneData | null>(null);
  const [openCount, setOpenCount] = React.useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [bottomSheetState, setBottomSheetState] =
    React.useState<BottomSheetState>("hidden");
  const [canvasRect, setCanvasRect] = React.useState<CanvasRect>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const openZonePanel = React.useCallback(
    (zoneName: string, data?: ZoneData) => {
      setSelectedZone(zoneName);
      if (data) setZoneData(data);
      setZonePanelOpen(true);
      setOpenCount((c) => c + 1);
    },
    [],
  );

  const closeZonePanel = React.useCallback(() => {
    setZonePanelOpen(false);
    setTimeout(() => {
      setSelectedZone(undefined);
      setZoneData(null);
    }, 500);
  }, []);

  const toggleSidebar = React.useCallback(
    () => setSidebarCollapsed((v) => !v),
    [],
  );
  const collapseSidebar = React.useCallback(
    () => setSidebarCollapsed(true),
    [],
  );
  const expandSidebar = React.useCallback(() => setSidebarCollapsed(false), []);

  const contextValue = React.useMemo(
    () => ({
      footprintType,
      setFootprintType,
      scope,
      setScope,
      flowTracing,
      setFlowTracing,
      sidebarControls,
      setSidebarControls,
      zonePanelOpen,
      selectedZone,
      zoneData,
      openCount,
      openZonePanel,
      closeZonePanel,
      sidebarCollapsed,
      toggleSidebar,
      collapseSidebar,
      expandSidebar,
      bottomSheetState,
      setBottomSheetState,
      canvasRect,
      setCanvasRect,
    }),
    [
      footprintType,
      setFootprintType,
      scope,
      setScope,
      flowTracing,
      setFlowTracing,
      sidebarControls,
      setSidebarControls,
      zonePanelOpen,
      selectedZone,
      zoneData,
      openCount,
      openZonePanel,
      closeZonePanel,
      sidebarCollapsed,
      toggleSidebar,
      collapseSidebar,
      expandSidebar,
      bottomSheetState,
      setBottomSheetState,
      canvasRect,
      setCanvasRect,
    ],
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

function useDashboard() {
  const ctx = React.useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}

export function useMapControls() {
  const { footprintType, setFootprintType, scope, setScope } = useDashboard();
  return { footprintType, setFootprintType, scope, setScope };
}
export function useFlowTracing() {
  const { flowTracing, setFlowTracing } = useDashboard();
  return { flowTracing, setFlowTracing };
}
export function useSidebarControls() {
  return useDashboard().setSidebarControls;
}
export function useSidebarSlot() {
  return useDashboard().sidebarControls;
}
export function useZonePanel() {
  const {
    zonePanelOpen,
    selectedZone,
    zoneData,
    openCount,
    openZonePanel,
    closeZonePanel,
  } = useDashboard();
  return {
    zonePanelOpen,
    selectedZone,
    zoneData,
    openCount,
    openZonePanel,
    closeZonePanel,
  };
}
export function useSidebar() {
  const { sidebarCollapsed, toggleSidebar, collapseSidebar, expandSidebar } =
    useDashboard();
  return { sidebarCollapsed, toggleSidebar, collapseSidebar, expandSidebar };
}
export function useBottomSheet() {
  const { bottomSheetState, setBottomSheetState } = useDashboard();
  return { bottomSheetState, setBottomSheetState };
}
export function useCanvasRect() {
  const { canvasRect, setCanvasRect } = useDashboard();
  return { canvasRect, setCanvasRect };
}
