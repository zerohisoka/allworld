"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface KPICardProps {
  /** Small uppercase label above the number. */
  label: string;
  /** The big stat — rendered in salmon pink, light weight, tight tracking. */
  value: React.ReactNode;
  /** Optional sub-label (rendered under the value, small, uppercase). */
  subValue?: React.ReactNode;
  /** Optional trend string like "+12%" or "-3.4%". */
  trend?: string;
  /** Direction of the trend. Defaults to true (up = good / green). */
  trendUp?: boolean;
  /** Optional unit suffix appended to the value. */
  unit?: string;
  className?: string;
}

/**
 * KPICard — a single big-number stat card.
 *
 * The headline number uses the brand's salmon-pink (#e8a5a5) and a light
 * font weight with tight tracking, per the design system.
 */
export function KPICard({
  label,
  value,
  subValue,
  trend,
  trendUp = true,
  unit,
  className,
}: KPICardProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="text-[10px] uppercase tracking-widest text-aura-muted">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-light tracking-tighter text-aura-pink tabular-nums">
          {value}
        </span>
        {unit ? (
          <span className="text-lg font-light text-aura-muted">{unit}</span>
        ) : null}
      </div>
      {subValue ? (
        <div className="text-[10px] uppercase tracking-widest text-aura-muted">
          {subValue}
        </div>
      ) : null}
      {trend ? (
        <div
          className={cn(
            "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs",
            trendUp
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-[#3d1f1f] text-aura-pink",
          )}
        >
          {trendUp ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {trend}
        </div>
      ) : null}
    </div>
  );
}
