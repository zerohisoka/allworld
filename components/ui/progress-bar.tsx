"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

type Tone = "emerald" | "cyan" | "mixed" | "violet" | "pink";

export interface ProgressBarProps {
  /** 0–100. */
  value: number;
  /** Color tone. "mixed" uses emerald→cyan gradient. */
  tone?: Tone;
  /** When true, draws the fill on mount. */
  animate?: boolean;
  /** Track height in pixels. */
  height?: number;
  className?: string;
  /** Optional ARIA label. */
  ariaLabel?: string;
}

const TONE_TO_BG: Record<Tone, string> = {
  emerald: "bg-emerald-400",
  cyan: "bg-cyan-400",
  mixed: "bg-gradient-to-r from-emerald-400 to-cyan-400",
  violet: "bg-violet-400",
  pink: "bg-[#e8a5a5]",
};

const TONE_TO_SHADOW: Record<Tone, string> = {
  emerald: "shadow-[0_0_10px_rgba(126,231,135,0.4)]",
  cyan: "shadow-[0_0_10px_rgba(103,232,249,0.4)]",
  mixed: "shadow-[0_0_10px_rgba(103,232,249,0.4)]",
  violet: "shadow-[0_0_10px_rgba(167,139,250,0.4)]",
  pink: "shadow-[0_0_10px_rgba(232,165,165,0.4)]",
};

/**
 * ProgressBar — a thin (default 4px) bar.
 * Track is white/5, fill is the chosen tone with a soft glow.
 */
export function ProgressBar({
  value,
  tone = "mixed",
  animate = true,
  height = 4,
  className,
  ariaLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn(
        "w-full overflow-hidden rounded-full bg-white/[0.05]",
        className,
      )}
      style={{ height }}
    >
      <motion.div
        initial={animate ? { width: 0 } : { width: `${clamped}%` }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className={cn(
          "h-full rounded-full",
          TONE_TO_BG[tone],
          TONE_TO_SHADOW[tone],
        )}
      />
    </div>
  );
}
