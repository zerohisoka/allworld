"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { GlassCard, ProgressBar, VarianceBadge, CountUp } from "@/components/ui";
import { cn } from "@/lib/utils";

type FlagRow = {
  id: string;
  date: string;
  severity: 1 | 2 | 3;
  employee_name: string | null;
  variance_percent: number;
  variance_type: string;
  resolved: boolean;
};

export function AuditPipelineCard() {
  const [flags, setFlags] = React.useState<FlagRow[]>([]);
  const [flaggedCount, setFlaggedCount] = React.useState(14);
  const [autoResolvedPct, setAutoResolvedPct] = React.useState(92);
  const [autoLagged, setAutoLagged] = React.useState(12);
  const [discrepancies, setDiscrepancies] = React.useState(13);
  const [resolved, setResolved] = React.useState(3);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    fetch("/api/dashboard/data")
      .then((r) => r.json())
      .then((data) => {
        setFlaggedCount(data.summary?.flagged_discrepancies ?? 14);
        setAutoResolvedPct(data.summary?.auto_resolved_percent ?? 92);
        setAutoLagged(data.summary?.auto_lagged_count ?? 12);
        setDiscrepancies(data.summary?.discrepancies_count ?? 13);
        setResolved(data.summary?.resolved_count ?? 3);
        setFlags(
          (data.flags || []).map((f: any) => ({
            id: f.id,
            date: f.date,
            severity: f.severity,
            employee_name: f.employee_name || f.employee_id,
            variance_percent: f.variance_percent,
            variance_type: f.variance_type,
            resolved: f.resolved,
          })),
        );
      })
      .catch(() => {});
  }, []);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(flags.length / pageSize));
  const pageFlags = flags.slice((page - 1) * pageSize, page * pageSize);

  return (
    <GlassCard padding="md" className="flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white">
            Audit Reconciliation Pipeline
          </h3>
          <p className="mt-1 text-[10px] text-aura-muted">
            Real-time biometric-vs-shift variance flags.
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
            <CountUp value={flaggedCount} />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-aura-muted">
            Flagged Discrepancies
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-light tracking-tighter text-emerald-300 tabular-nums">
            <CountUp value={autoResolvedPct} duration={1.4} delay={0.25} />
            <span>%</span>
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-widest text-aura-muted">
            Auto-Resolved
          </div>
        </div>
      </div>

      {/* Sub-stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <SubStat label="Auto-Lagged" value={autoLagged} delay={0.35} />
        <SubStat label="Discrepancies" value={discrepancies} delay={0.42} />
        <SubStat label="Resolved" value={resolved} delay={0.49} />
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
          {pageFlags.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-[10px] text-aura-muted">
              No reconciliation data yet — upload attendance files to get started.
            </div>
          ) : (
            pageFlags.map((r, i) => (
              <div
                key={r.id}
                className={cn(
                  "grid grid-cols-[1fr_auto] items-center gap-2 border-b border-white/[0.02] px-3 py-2 text-[11px] transition-colors last:border-b-0 hover:bg-white/[0.02] md:grid-cols-[1.4fr_1fr_0.7fr_0.9fr_24px]",
                  i % 2 === 1 && "bg-white/[0.015]",
                )}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-white/80 tabular-nums">{r.date}</span>
                  <div className="flex items-center gap-2 text-[10px] text-aura-muted md:hidden">
                    <span>{r.employee_name || r.variance_type}</span>
                    <span>·</span>
                    <span className="tabular-nums text-white/70">{r.variance_percent}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <VarianceBadge level={r.severity} />
                  <ChevronRight className="h-3.5 w-3.5 text-aura-muted" />
                </div>
                <span className="hidden text-white/60 md:inline">{r.employee_name || r.variance_type}</span>
                <span className="hidden text-white/80 tabular-nums md:inline">{r.variance_percent}%</span>
                <span className="hidden md:inline" />
              </div>
            ))
          )}
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-white/[0.04] bg-white/[0.02] px-3 py-2 text-[10px] text-aura-muted">
          <span>{flags.length} flags</span>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md p-1 hover:bg-white/[0.04] hover:text-white"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-white">
              {page}
            </span>
            <span>of {totalPages}</span>
            <button
              className="rounded-md p-1 hover:bg-white/[0.04] hover:text-white"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
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
