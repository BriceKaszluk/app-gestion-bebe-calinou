"use client";

import * as React from "react";

type ChartSize = { width: number; height: number };

export function useChartSize() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState<ChartSize>({
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof ResizeObserver === "undefined") {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({
        width: width ?? 0,
        height: height ?? 0,
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, size };
}
