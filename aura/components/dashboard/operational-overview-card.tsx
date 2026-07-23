"use client";

import { ArrowUp, MoreHorizontal } from "lucide-react";
import * as React from "react";

import {
  GlassCard,
  ProgressBar,
  CountUp,
  CompactCurrency,
  PercentCount,
} from "@/components/ui";
import { cn } from "@/lib/utils";

import { Sparkline } from "./charts";

/* ----------------------------------------------------------------
   Operational Overview — the right column of the dashboard.
   Packs: 3-up KPI tiles, productivity bar, real-time variance
   sparkline, predictive analytics, and system health.
   ---------------------------------------------------------------- */
export function OperationalOverviewCard() {
  return (
    <GlassCard padding="md" className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white">
            Operational Overview
          </h3>
          <p className="mt-1 text-[10px] text-aura-muted">
            Real-time aggregate across all branches
          </p>
        </div>
        <button
          aria-label="More"
          className="rounded-md p-1 text-aura-muted hover:bg-white/[0.04] hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* 3-up KPI tiles */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <KpiTile
          label="Total value"
          valueNode={<CompactCurrency value={1.2} />}
          trend="503%"
        />
        <KpiTile
          label="Current values"
          valueNode={
            <>
              <PercentCount value={88.7} />
              <span>%</span>
            </>
          }
          trend="100%"
        />
        <KpiTile
          label="Total"
          valueNode={
            <>
              <PercentCount value={89.5} delay={0.25} />
              <span>%</span>
            </>
          }
          trend="100%"
        />
      </div>

      {/* Current productivity — with low/high labels */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-aura-muted">
            Current productivity
          </span>
          <span className="text-sm font-medium text-emerald-300 tabular-nums">
            <PercentCount value={88.4} />
            <span>%</span>
          </span>
        </div>
        <ProgressBar value={88.4} tone="emerald" />
        <div className="mt-1.5 flex items-center justify-between text-[9px] uppercase tracking-widest text-aura-muted">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Real-time variance sparkline */}
      <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-aura-muted">
            Real-time variance
          </span>
          <span className="rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/70">
            Date ▾
          </span>
        </div>
        <Sparkline
          data={[12, 18, 14, 22, 16, 28, 24, 20, 26, 30, 22, 18, 24, 32, 28, 22, 26, 30, 24, 20]}
          stroke="rgba(103,232,249,1)"
          fill="rgba(103,232,249,0.18)"
          height={64}
        />
        <div className="mt-2 flex items-center justify-between text-[9px] uppercase tracking-widest text-aura-muted">
          <span>Low</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>High</span>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white">
            Predictive Analytics
          </span>
          <MoreHorizontal className="h-3.5 w-3.5 text-aura-muted" />
        </div>
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="text-aura-muted">
                Forecasted Report Generation: 90% Complete
              </span>
            </div>
            <ProgressBar value={90} tone="cyan" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="text-aura-muted">
                Forecasted Report TeM: 50% Complete
              </span>
            </div>
            <ProgressBar value={50} tone="emerald" />
          </div>
        </div>
      </div>

      {/* System Health & API Utilization */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white">
            System Health & Api Utilization
          </span>
          <MoreHorizontal className="h-3.5 w-3.5 text-aura-muted" />
        </div>
        <div className="space-y-3">
          <UtilRow
            label="Current flow usage"
            sub="Flow"
            value={60}
            display="60%"
            tone="cyan"
          />
          <UtilRow
            label="Caching usage"
            sub="393.9 MB"
            value={80}
            display="80%"
            tone="violet"
          />
          <UtilRow
            label="Caching status"
            sub=""
            value={50}
            display="50%"
            tone="emerald"
          />
        </div>
      </div>
    </GlassCard>
  );
}

function KpiTile({
  label,
  valueNode,
  trend,
}: {
  label: string;
  valueNode: React.ReactNode;
  trend: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
      <div className="text-[9px] uppercase tracking-widest text-aura-muted">
        {label}
      </div>
      <div className="mt-1 text-base font-light tracking-tighter text-white tabular-nums">
        {valueNode}
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-400">
        <ArrowUp className="h-2.5 w-2.5" />
        {trend}
      </div>
    </div>
  );
}

function UtilRow({
  label,
  sub,
  value,
  display,
  tone,
}: {
  label: string;
  sub: string;
  value: number;
  display: string;
  tone: "cyan" | "emerald" | "violet";
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px]">
        <span className="text-aura-muted">{label}</span>
        <span
          className={cn(
            "tabular-nums",
            tone === "cyan"
              ? "text-cyan-300"
              : tone === "emerald"
                ? "text-emerald-300"
                : "text-violet-300",
          )}
        >
          {display}
        </span>
      </div>
      <ProgressBar value={value} tone={tone} height={3} />
      {sub ? (
        <div className="mt-1 text-[9px] uppercase tracking-widest text-aura-muted">
          {sub}
        </div>
      ) : null}
    </div>
  );
}
