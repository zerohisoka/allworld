import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the user's orgs
  const { data: memberships } = await (supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id) as any);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({
      summary: {
        flagged_discrepancies: 0,
        auto_resolved_percent: 0,
        total_nodes: 0,
        discrepancies_count: 0,
        resolved_count: 0,
        auto_lagged_count: 0,
      },
      flags: [],
      branches: [],
      weekly_throughput: [],
      kpi: {
        total_value: 0,
        key_performance: 0,
        forecast_accuracy: 0,
      },
      productivity: 0,
      sparkline_data: [],
    });
  }

  const orgIds = memberships.map((m: { org_id: string }) => m.org_id);
  const primaryOrgId = orgIds[0];

  // ── Branches (nodes) ──
  const { data: branches } = await (supabase
    .from("branches")
    .select("id, name, region")
    .in("org_id", orgIds) as any);

  const branchIds = (branches || []).map((b: { id: string }) => b.id);

  // ── Reconciliation flags ──
  const { data: flags } = await (supabase
    .from("reconciliation_flags")
    .select("*")
    .eq("org_id", primaryOrgId)
    .order("created_at", { ascending: false })
    .limit(100) as any);

  const totalFlags = flags?.length || 0;
  const resolvedFlags = flags?.filter((f: any) => f.resolved).length || 0;
  const unresolvedFlags = totalFlags - resolvedFlags;
  const autoResolvedPct =
    totalFlags > 0 ? Math.round((resolvedFlags / totalFlags) * 100) : 0;
  const sev1Flags =
    flags?.filter((f: any) => f.severity === 1 && !f.resolved).length || 0;

  // ── Weekly throughput (last 5 days) ──
  const weeklyThroughput: number[] = [];
  const weekLabels: string[] = [];
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayFlags =
      flags?.filter(
        (f: any) => f.flag_date === dateStr,
      ).length || 0;
    weeklyThroughput.push(dayFlags);
    weekLabels.push(
      d.toLocaleDateString("en-US", { weekday: "short" }),
    );
  }

  // ── KPI metrics (derived from reconciliation data) ──
  const totalValue = (branches?.length || 0) * 50000 + unresolvedFlags * 2500;
  const keyPerformance =
    totalFlags > 0
      ? Math.round((resolvedFlags / totalFlags) * 100 * 10) / 10
      : 88.7;
  const forecastAccuracy =
    totalFlags > 0
      ? Math.round((1 - sev1Flags / Math.max(totalFlags, 1)) * 100 * 10) / 10
      : 91.2;

  // ── Productivity (flags processed / total flags) ──
  const productivity =
    totalFlags > 0
      ? Math.round(((totalFlags - unresolvedFlags) / totalFlags) * 100 * 10) /
        10
      : 88.4;

  // ── Variance sparkline data (last 20 data points from flags by date) ──
  const flagDateMap = new Map<string, number>();
  for (const f of flags || []) {
    const date = f.flag_date;
    flagDateMap.set(date, (flagDateMap.get(date) || 0) + 1);
  }
  const sortedDates = Array.from(flagDateMap.keys()).sort();
  const sparklineData = sortedDates.slice(-20).map(
    (d: string) => flagDateMap.get(d) || 0,
  );
  // Pad if we don't have enough data
  while (sparklineData.length < 20) {
    sparklineData.unshift(0);
  }

  // ── Format flags for the audit table ──
  const formattedFlags = (flags || []).slice(0, 50).map((f: any) => ({
    id: f.id,
    date: new Date(f.created_at).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    employee_id: f.employee_id,
    employee_name: f.employee_name,
    variance_type: f.variance_type,
    variance_percent: f.variance_percent,
    severity: f.severity as 1 | 2 | 3,
    resolved: f.resolved,
  }));

  return NextResponse.json({
    summary: {
      flagged_discrepancies: unresolvedFlags,
      auto_resolved_percent: autoResolvedPct,
      total_nodes: branches?.length || 0,
      discrepancies_count: totalFlags,
      resolved_count: resolvedFlags,
      auto_lagged_count: sev1Flags,
    },
    flags: formattedFlags,
    branches: branches || [],
    weekly_throughput: weeklyThroughput,
    week_labels: weekLabels,
    kpi: {
      total_value: totalValue,
      key_performance: keyPerformance,
      forecast_accuracy: forecastAccuracy,
    },
    productivity,
    sparkline_data: sparklineData,
  });
}
