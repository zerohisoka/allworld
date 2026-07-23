"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { GlassCard, ProgressBar, VarianceBadge, CountUp } from "@/components/ui";
import { cn } from "@/lib/utils";

type Row = {
  date: string;
  checks: 1 | 2 | 3;
  bio: string; // "Light" | "Right" etc.
  shift: string; // percentage string
  highlighted?: boolean;
};

const ROWS: Row[] = [
  { date: "06/12/2023, 12:35 AM", checks: 1, bio: "Light", shift: "40.80%ko" },
  { date: "06/12/2023, 12:33 AM", checks: 2, bio: "Light", shift: "90.90%ko" },
  { date: "06/13/2023, 10:35 PM", checks: 3, bio: "Right", shift: "90.00%ko" },
  { date: "06/13/2023, 12:35 PM", checks: 2, bio: "Light", shift: "90.80%ko" },
  { date: "06/12/2023, 12:35 PM", checks: 2, bio: "Right", shift: "50.90%ko" },
  { date: "06/12/2023, 12:35 PM", checks: 2, bio: "Light", shift: "85.77%ko" },
  { date: "06/13/2023, 12:33 PM", checks: 2, bio: "Light", shift: "50.80%ko" },
  { date: "06/12/2023, 12:38 PM", checks: 2, bio: "Light", shift: "20.80%ko" },
  { date: "06/12/2023, 12:38 PM", checks: 2, bio: "Light", shift: "26.92%ko" },
  { date: "06/13/2023, 10:35 PM", checks: 2, bio: "Light", shift: "50.80%ko" },
];

export function AuditPipelineCard() {
  return (
    <GlassCard padding="md" className="flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white">
            Audit Reconciliation Pipeline
          </h3>
          <p className="mt-1 text-[10px] text-aura-muted">
            Real-time biometric-vs-ighlighted flags.
          </p>
        </div>
        <button
          aria-label="More"
          className="rounded-md p-1 text-aura-muted hover:bg-white/[0.04] hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Big numbers */}
      <div className="mb-5 flex items-end gap-6">
        <div>
          <div className="text-5xl font-light tracking-tighter text-aura-pink tabular-nums">
            <CountUp value={14} />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-aura-muted">
            Flagged Discrepancies
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-light tracking-tighter text-emerald-300 tabular-nums">
            <CountUp value={92} duration={1.4} delay={0.25} />
            <span>%</span>
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-widest text-aura-muted">
            Auto-Resolved
          </div>
        </div>
      </div>

      {/* Sub-stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <SubStat label="Auto-Lagged" value={12} delay={0.35} />
        <SubStat label="Discrepancies" value={13} delay={0.42} />
        <SubStat label="Resolved" value={3} delay={0.49} />
      </div>

      {/* Toggle */}
      <div className="mb-3 inline-flex w-fit rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5 text-[11px]">
        <button className="rounded-full bg-white px-3 py-1 font-medium text-black">
          Live Data
        </button>
        <button className="rounded-full px-3 py-1 text-white/60 hover:text-white">
          Manual
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-white/[0.04]">
        <div className="hidden md:grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_24px] items-center gap-2 border-b border-white/[0.04] bg-white/[0.02] px-3 py-2 text-[10px] uppercase tracking-widest text-aura-muted">
          <span>Date time</span>
          <span>Variance Checks</span>
          <span>Biovarcity</span>
          <span>Shift</span>
          <span />
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {ROWS.map((r, i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[1fr_auto] items-center gap-2 border-b border-white/[0.02] px-3 py-2 text-[11px] transition-colors last:border-b-0 hover:bg-white/[0.02] md:grid-cols-[1.4fr_1fr_0.7fr_0.9fr_24px]",
                i % 2 === 1 && "bg-white/[0.015]",
              )}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-white/80 tabular-nums">{r.date}</span>
                <div className="flex items-center gap-2 text-[10px] text-aura-muted md:hidden">
                  <span>{r.bio}</span>
                  <span>·</span>
                  <span className="tabular-nums text-white/70">{r.shift}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <VarianceBadge level={r.checks} />
                <ChevronRight className="h-3.5 w-3.5 text-aura-muted" />
              </div>
              <span className="hidden text-white/60 md:inline">{r.bio}</span>
              <span className="hidden text-white/80 tabular-nums md:inline">{r.shift}</span>
              <span className="hidden md:inline" />
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-white/[0.04] bg-white/[0.02] px-3 py-2 text-[10px] text-aura-muted">
          <span>Live Data Cricks</span>
          <div className="flex items-center gap-2">
            <button className="rounded-md p-1 hover:bg-white/[0.04] hover:text-white">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-white">
              1
            </span>
            <span>Next</span>
            <button className="rounded-md p-1 hover:bg-white/[0.04] hover:text-white">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function SubStat({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
      <div className="text-xl font-light tracking-tighter text-white tabular-nums">
        <CountUp value={value} duration={0.9} delay={delay} />
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-widest text-aura-muted">
        {label}
      </div>
    </div>
  );
}

// Allow unused-import suppression for ProgressBar in some configs
void ProgressBar;
