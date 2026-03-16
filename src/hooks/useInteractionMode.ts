'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true if the primary input is touch (no fine pointer / no hover).
 * This is based on actual device capabilities, not screen size.
 *
 * - Mouse/trackpad → isTouch: false  → show desktop layout
 * - Touchscreen    → isTouch: true   → show mobile layout
 *
 * Also listens for changes (e.g. connecting a mouse to a tablet).
 */
export function useInteractionMode() {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof globalThis !== 'undefined' && 'matchMedia' in globalThis) {
      return globalThis.matchMedia('(hover: none) and (pointer: coarse)')
        .matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !('matchMedia' in globalThis))
      return;

    const mq = globalThis.matchMedia('(hover: none) and (pointer: coarse)');

    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { isTouch };
}
