"use client";

import { ArrowUp, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { CountUp, GlassCard, PercentCount } from "@/components/ui";
import { cn } from "@/lib/utils";

import { AreaChart } from "./charts";

/* Mon–Fri synthetic data — gradient area fill on a single line. */
const WEEK_DATA = [42, 58, 51, 74, 88];
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function KPIChartCard() {
  return (
    <GlassCard padding="md" className="flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white">
            Key Performance Metrics
          </h3>
          <p className="mt-1 text-[10px] text-aura-muted">
            Weekly reconciliation throughput
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-md px-2 py-1 text-[10px] uppercase tracking-widest text-aura-muted hover:bg-white/[0.04] hover:text-white">
            Dashboard
          </button>
          <button className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-widest text-white">
            Settings
          </button>
          <button
            aria-label="More"
            className="ml-1 rounded-md p-1 text-aura-muted hover:bg-white/[0.04] hover:text-white"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Top stat row */}
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <BigStat
          label="Total value"
          valueNode={
            <>
              $<CountUp value={234500} duration={1.6} />
            </>
          }
          trend="+50%"
          tone="emerald"
        />
        <BigStat
          label="Key performance"
          valueNode={
            <>
              <PercentCount value={33.8} delay={0.1} />
              <span>%</span>
            </>
          }
          trend="+100%"
          tone="emerald"
        />
        <BigStat
          label="Forecast accuracy"
          valueNode={
            <>
              <PercentCount value={91.2} delay={0.2} />
              <span>%</span>
            </>
          }
          trend="+12.4%"
          tone="cyan"
        />
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-aura-muted">
              Throughput · last 5 days
            </span>
            <div className="flex items-center gap-3 text-[10px] text-aura-muted">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-aura-pink" />
                Live
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                Avg
              </span>
            </div>
          </div>
          <AreaChart
            data={WEEK_DATA}
            labels={WEEK_LABELS}
            height={180}
            stroke="rgba(232,165,165,1)"
            fillTop="rgba(232,165,165,0.30)"
          />
        </div>

        {/* Right summary list — like the design ref's stacked rows */}
        <div className="flex flex-col gap-2">
          {[
            { label: "Avero Viperating Commitment", sub: "$3,983 · 1m ago", pct: 45 },
            { label: "Nest performance monitors", sub: "$7,548 · 1m ago", pct: 48 },
            { label: "MIS", sub: "$3 past a month ago", pct: 46 },
            { label: "Branch delta", sub: "vs last week", pct: 62 },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="truncate text-white/80">{row.label}</span>
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400 tabular-nums">
                  {row.pct}%
                </span>
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-widest text-aura-muted">
                {row.sub}
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function BigStat({
  label,
  valueNode,
  trend,
  tone,
}: {
  label: string;
  valueNode: React.ReactNode;
  trend: string;
  tone: "emerald" | "cyan";
}) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-widest text-aura-muted">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-light tracking-tighter text-white tabular-nums">
          {valueNode}
        </span>
      </div>
      <div
        className={cn(
          "mt-0.5 flex items-center gap-1 text-[10px]",
          tone === "emerald" ? "text-emerald-400" : "text-cyan-300",
        )}
      >
        <ArrowUp className="h-2.5 w-2.5" />
        {trend}
      </div>
    </div>
  );
}
