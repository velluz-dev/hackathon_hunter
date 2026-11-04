"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up from 0 to `target` the first time it's shown (skipped for reduced motion).
 * After that first run, later changes jump straight to the new value.
 */
export function useCountUp(target: number, ms = 900): number {
  const [value, setValue] = useState(target);
  const finished = useRef(false);

  useEffect(() => {
    if (finished.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finished.current = true;
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setValue(target * (1 - (1 - p) ** 3)); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
      else finished.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}
