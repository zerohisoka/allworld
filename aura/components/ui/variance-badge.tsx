"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const varianceBadgeStyles = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tracking-wide",
  {
    variants: {
      level: {
        /** Default — Variance 1: salmon on dark red-brown. */
        1: "bg-[#3d1f1f] text-aura-pink",
        2: "bg-[#3d1f1f] text-aura-pink",
        3: "bg-[#3d1f1f] text-aura-pink",
        /** Neutral — for non-variance rows. */
        ok: "bg-emerald-500/10 text-emerald-400",
        /** Warning — yellow-ish but still on-brand. */
        warn: "bg-amber-500/10 text-amber-300",
      },
    },
    defaultVariants: {
      level: 1,
    },
  },
);

export interface VarianceBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof varianceBadgeStyles> {
  /** The level drives both copy and color. 1–3 = "Variance N". */
  level?: 1 | 2 | 3 | "ok" | "warn";
}

export function VarianceBadge({
  className,
  level = 1,
  children,
  ...props
}: VarianceBadgeProps) {
  const content =
    children ??
    (level === "ok"
      ? "OK"
      : level === "warn"
        ? "Watch"
        : `Variance ${level}`);
  return (
    <span
      className={cn(varianceBadgeStyles({ level }), className)}
      {...props}
    >
      {content}
    </span>
  );
}
