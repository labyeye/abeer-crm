import React, { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  locale?: string;
  format?: (v: number) => string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 800,
  prefix = "",
  suffix = "",
  locale,
  format,
}) => {
  const [display, setDisplay] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef<number>(0);

  useEffect(() => {
    const start = (ts: number) => {
      startRef.current = ts;
      fromRef.current = display;
      const step = (now: number) => {
        if (!startRef.current) startRef.current = now;
        const elapsed = now - startRef.current;
        const t = Math.min(1, elapsed / Math.max(1, duration));
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
        const current = fromRef.current + (value - fromRef.current) * eased;
        setDisplay(current);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    };

    // cancel any running frame
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    rafRef.current = requestAnimationFrame(start);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const rendered = format
    ? format(Math.round(display))
    : (locale
        ? Math.round(display).toLocaleString(locale)
        : Math.round(display).toLocaleString());

  return (
    <span>
      {prefix}
      {rendered}
      {suffix}
    </span>
  );
};

export default AnimatedNumber;
