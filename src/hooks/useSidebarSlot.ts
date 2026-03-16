"use client";

import { useEffect } from "react";
import { useSidebarControls } from "@/src/app/(dashboard)/layout";

/**
 * Call this hook in any dashboard page to mount JSX into the sidebar controls slot.
 *
 * Usage:
 *   useSidebarSlot(<DateSelector ... />)
 *
 * The slot is cleared automatically when the page unmounts.
 */
export function useSidebarSlot(node: React.ReactNode) {
  const setControls = useSidebarControls();

  useEffect(() => {
    setControls(node);
    return () => setControls(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
