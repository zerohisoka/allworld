import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch the report
  const { data: report, error: reportError } = await (supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single() as any);

  if (reportError || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Verify access
  const { data: membership } = await (supabase
    .from("org_members")
    .select("role")
    .eq("org_id", report.org_id)
    .eq("user_id", user.id)
    .single() as any);

  if (!membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Fetch reconciliation flags for this report's scope
  let query: any = supabase
    .from("reconciliation_flags")
    .select("*")
    .eq("org_id", report.org_id);

  if (report.branch_id) {
    query = query.eq("branch_id", report.branch_id);
  }

  if (report.date_range_start) {
    query = query.gte("flag_date", report.date_range_start);
  }

  if (report.date_range_end) {
    query = query.lte("flag_date", report.date_range_end);
  }

  const { data: flags } = await query.order("flag_date", { ascending: false });

  // Build CSV
  const headers = [
    "Date",
    "Employee ID",
    "Employee Name",
    "Branch ID",
    "Variance Type",
    "Variance %",
    "Severity",
    "Resolved",
    "Notes",
  ];

  const csvRows = [headers.join(",")];

  for (const f of flags || []) {
    const row = [
      f.flag_date,
      escapeCsv(f.employee_id),
      escapeCsv(f.employee_name || ""),
      f.branch_id,
      f.variance_type,
      f.variance_percent,
      f.severity,
      f.resolved ? "Yes" : "No",
      escapeCsv(f.notes || ""),
    ];
    csvRows.push(row.join(","));
  }

  const csv = csvRows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${report.title.replace(/[^a-zA-Z0-9]/g, "_")}.csv"`,
    },
  });
}

function escapeCsv(value: string): string {
  // Guard against CSV injection (formulas starting with = + - @)
  let safe = value;
  if (
    safe.startsWith("=") ||
    safe.startsWith("+") ||
    safe.startsWith("-") ||
    safe.startsWith("@")
  ) {
    safe = `"${safe}"`;
  }
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}
