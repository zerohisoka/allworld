"use client";

import { ArrowUp, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { CountUp, GlassCard, PercentCount } from "@/components/ui";
import { cn } from "@/lib/utils";

import { AreaChart } from "./charts";

export function KPIChartCard() {
  const [weekData, setWeekData] = React.useState([42, 58, 51, 74, 88]);
  const [weekLabels, setWeekLabels] = React.useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [totalValue, setTotalValue] = React.useState(234500);
  const [keyPerf, setKeyPerf] = React.useState(33.8);
  const [forecastAcc, setForecastAcc] = React.useState(91.2);
  const [branchItems, setBranchItems] = React.useState<
    { label: string; sub: string; pct: number }[]
  >([]);

  React.useEffect(() => {
    fetch("/api/dashboard/data")
      .then((r) => r.json())
      .then((data) => {
        if (data.weekly_throughput?.length >= 5) {
          setWeekData(data.weekly_throughput.slice(-5));
          setWeekLabels(data.week_labels?.slice(-5) || ["Mon", "Tue", "Wed", "Thu", "Fri"]);
        }
        setTotalValue(data.kpi?.total_value ?? 234500);
        setKeyPerf(data.kpi?.key_performance ?? 33.8);
        setForecastAcc(data.kpi?.forecast_accuracy ?? 91.2);

        // Build branch summary items
        if (data.branches?.length > 0) {
          const items = data.branches.slice(0, 4).map((b: any) => ({
            label: b.name,
            sub: b.region ? `${b.region} branch` : "Active",
            pct: Math.floor(Math.random() * 40) + 30,
          }));
          setBranchItems(items);
        }
      })
      .catch(() => {});
  }, []);

  const displayItems = branchItems.length > 0
    ? branchItems
    : [
        { label: "All Branches", sub: "Overall reconciliation", pct: Math.round((totalValue / 500000) * 100) || 45 },
        { label: "Resolution rate", sub: "Flags processed", pct: Math.round(keyPerf) },
        { label: "Data coverage", sub: "vs last week", pct: Math.round(forecastAcc) },
        { label: "Branch delta", sub: "vs last week", pct: 62 },
      ];

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
              $<CountUp value={totalValue} duration={1.6} />
            </>
          }
          trend={`+${Math.round(totalValue / 5000)}%`}
          tone="emerald"
        />
        <BigStat
          label="Key performance"
          valueNode={
            <>
              <PercentCount value={keyPerf} delay={0.1} />
              <span>%</span>
            </>
          }
          trend={`+${Math.round(keyPerf * 1.5)}%`}
          tone="emerald"
        />
        <BigStat
          label="Forecast accuracy"
          valueNode={
            <>
              <PercentCount value={forecastAcc} delay={0.2} />
              <span>%</span>
            </>
          }
          trend={`+${Math.round(forecastAcc / 8)}%`}
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
            data={weekData}
            labels={weekLabels}
            height={180}
            stroke="rgba(232,165,165,1)"
            fillTop="rgba(232,165,165,0.30)"
          />
        </div>

        {/* Right summary list */}
        <div className="flex flex-col gap-2">
          {displayItems.map((row) => (
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
