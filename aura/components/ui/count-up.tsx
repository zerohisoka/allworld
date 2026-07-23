"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------
   CountUp — animates a number from 0 (or `from`) to `value`.
   - Respects prefers-reduced-motion
   - Triggers on first view
   - Customizable formatter (defaults to two-decimal fixed, then trims)
   ---------------------------------------------------------------- */
export interface CountUpProps {
  value: number;
  /** Start value. Defaults to 0. */
  from?: number;
  /** Total duration in seconds. */
  duration?: number;
  /** Optional delay before animation starts. */
  delay?: number;
  /** Number of decimal places to keep during the animation. */
  decimals?: number;
  /** Format the current value for display. If omitted, uses decimals. */
  format?: (n: number) => string;
  className?: string;
}

export function CountUp({
  value,
  from = 0,
  duration = 1.2,
  delay = 0.15,
  decimals = 0,
  format,
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const mv = useMotionValue(reduced ? value : from);
  const rounded = useTransform(mv, (latest) => {
    const factor = Math.pow(10, decimals);
    return Math.round(latest * factor) / factor;
  });
  const [display, setDisplay] = React.useState(
    format ? format(reduced ? value : from) : (reduced ? value : from).toFixed(decimals),
  );

  React.useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(format ? format(value) : value.toFixed(decimals));
      return;
    }
    const controls = animate(mv, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = rounded.on("change", (v) => {
      setDisplay(format ? format(v) : v.toFixed(decimals));
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, value, duration, delay, decimals, format, mv, rounded, reduced]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </motion.span>
  );
}

/* ----------------------------------------------------------------
   PercentCount — convenience wrapper for "88.4%" style values.
   ---------------------------------------------------------------- */
export function PercentCount({
  value,
  duration,
  delay,
  decimals = 1,
  className,
}: Omit<CountUpProps, "format"> & { decimals?: number }) {
  return (
    <CountUp
      value={value}
      duration={duration}
      delay={delay}
      decimals={decimals}
      className={className}
    />
  );
}

/* ----------------------------------------------------------------
   CompactCurrency — "$1.2M+" style. Animates to a compact form.
   ---------------------------------------------------------------- */
export function CompactCurrency({
  value,
  duration,
  delay,
  className,
}: Omit<CountUpProps, "format" | "decimals"> & {
  /** Numeric value in millions, e.g. 1.2. */
  value: number;
}) {
  return (
    <CountUp
      value={value}
      duration={duration}
      delay={delay}
      decimals={1}
      format={(n) => `$${n.toFixed(1)}M+`}
      className={className}
    />
  );
}
