"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUp,
  ChevronRight,
  Settings,
  TrendingUp,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------
   Mini sparkline SVG used inside the right "Key Performance" card.
   ---------------------------------------------------------------- */
function MiniSparkline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 32"
      className={cn("h-8 w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(103,232,249,0.45)" />
          <stop offset="100%" stopColor="rgba(103,232,249,0)" />
        </linearGradient>
      </defs>
      <path
        d="M0 22 L12 18 L24 24 L36 14 L48 20 L60 10 L72 16 L84 8 L96 14 L108 6 L120 12 L120 32 L0 32 Z"
        fill="url(#spark-fill)"
      />
      <path
        d="M0 22 L12 18 L24 24 L36 14 L48 20 L60 10 L72 16 L84 8 L96 14 L108 6 L120 12"
        fill="none"
        stroke="rgba(103,232,249,0.9)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ----------------------------------------------------------------
   Left card — "ACTIVE DATA RECONCILIATION"
   Mirrors the design ref: discrepancy list with progress bars and
   a small "Business" panel.
   ---------------------------------------------------------------- */
export function FloatingLeftCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-[320px] rounded-2xl border border-white/[0.08] bg-[#0a0a0f]/85 p-4 shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white">
            Active Data Reconciliation
          </div>
          <div className="mt-1 text-[10px] text-aura-muted">
            Real-time biometric-vs-shift variance
          </div>
          <div className="mt-0.5 text-[10px] text-aura-muted">
            Real-time discrepancy-shift highlighted flags.
          </div>
        </div>
        <span className="text-[10px] text-aura-muted">⋯</span>
      </div>

      {/* Discrepancy counter */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <div className="text-[11px] uppercase tracking-widest text-white/80">
          12 discrepancies
        </div>
        <span className="rounded-full bg-[#3d1f1f] px-1.5 py-0.5 text-[10px] font-medium text-aura-pink">
          12
        </span>
      </div>

      {/* Progress rows */}
      <div className="space-y-2">
        {[
          { label: "Bionvrcity", value: "40.80%", intensity: "low" as const },
          { label: "Response", value: "85.92%", intensity: "mid" as const },
          { label: "Total", value: "71%", intensity: "low" as const },
        ].map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[80px_1fr_24px] items-center gap-2"
          >
            <span className="text-[10px] text-aura-muted">{row.label}</span>
            <div className="relative h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  row.intensity === "mid" ? "bg-aura-pink" : "bg-aura-pink/70",
                )}
                style={{
                  width:
                    row.label === "Bionvrcity"
                      ? "40%"
                      : row.label === "Response"
                        ? "85%"
                        : "71%",
                }}
              />
            </div>
            <span className="text-[10px] text-aura-pink">▲</span>
          </div>
        ))}
      </div>

      {/* Highlighted tag */}
      <div className="mt-3 flex justify-end">
        <span className="rounded-md border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-aura-muted">
          Highlighted
        </span>
      </div>

      {/* Mini business panel */}
      <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="text-[10px] uppercase tracking-widest text-aura-muted">
          Business
        </div>
        <div className="mt-2 space-y-1.5">
          {[
            { label: "Bionvrcity", value: "49.66%" },
            { label: "Restance", value: "3.2%" },
          ].map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between text-[10px]"
            >
              <span className="text-aura-muted">{r.label}</span>
              <span className="text-white/80">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Right card — "KEY PERFORMANCE METRICS"
   Mirror of the design ref: total values, sparkline, list items.
   ---------------------------------------------------------------- */
export function FloatingRightCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-[320px] rounded-2xl border border-white/[0.08] bg-[#0a0a0f]/85 p-4 shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-white">
          Key Performance Metrics
        </div>
        <Settings className="h-3.5 w-3.5 text-aura-muted" />
      </div>

      {/* Tabs */}
      <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-2 text-[10px]">
        <div className="flex items-center gap-3">
          <span className="border-b border-white pb-1 text-white">Dashboard</span>
          <span className="text-aura-muted">Settings</span>
        </div>
        <span className="rounded-md border border-white/[0.06] px-1.5 py-0.5 text-aura-muted">
          Suit or date
        </span>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="text-[9px] uppercase tracking-widest text-aura-muted">
            Total value
          </div>
          <div className="mt-1 text-lg font-light tracking-tight text-white">
            $234,500
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-400">
            <ArrowUp className="h-2.5 w-2.5" />
            50%
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="text-[9px] uppercase tracking-widest text-aura-muted">
            Key performance
          </div>
          <div className="mt-1 text-lg font-light tracking-tight text-white">
            33.8%
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-400">
            <ArrowUp className="h-2.5 w-2.5" />
            100%
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
        <MiniSparkline />
      </div>

      {/* List rows */}
      <div className="mt-3 space-y-2">
        {[
          {
            label: "Aveero Viperating Commitment",
            sub: "$3,983 -1min days ago",
            pct: 45,
          },
          {
            label: "Nest performance monitors",
            sub: "$7,548 -1n mot ago",
            pct: 48,
          },
          {
            label: "MIS",
            sub: "$3 past a mon ago",
            pct: 46,
          },
        ].map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/80">{row.label}</span>
              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">
                {row.pct}%
              </span>
            </div>
            <div className="mt-1 text-[9px] text-aura-muted">{row.sub}</div>
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
  );
}

/* ----------------------------------------------------------------
   Misc tiny chips (used in the lower "floating stat" area).
   ---------------------------------------------------------------- */
export function FloatingStat({
  icon: Icon,
  label,
  value,
  tone = "cyan",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "cyan" | "emerald" | "violet";
  className?: string;
}) {
  const color =
    tone === "cyan"
      ? "text-cyan-300"
      : tone === "emerald"
        ? "text-emerald-300"
        : "text-violet-300";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0a0a0f]/80 px-3 py-1.5 backdrop-blur-md",
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", color)} />
      <span className="text-[10px] uppercase tracking-widest text-aura-muted">
        {label}
      </span>
      <span className="text-xs font-medium text-white">{value}</span>
    </div>
  );
}

export { Activity, AlertTriangle, TrendingUp };
