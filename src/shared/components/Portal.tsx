"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  targetId: string;
}

export function Portal({ children, targetId }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const targetElement = document.getElementById(targetId);

  if (!targetElement) return null;

  return createPortal(children, targetElement);
}
