import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { parseScheduleFile } from "@/lib/reconciliation/parser";
import { runReconciliation } from "@/lib/reconciliation/engine";
import { checkAndFireAlerts } from "@/lib/alert-engine";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const branchId = formData.get("branch_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!branchId) {
      return NextResponse.json(
        { error: "branch_id is required" },
        { status: 400 },
      );
    }

    // Verify user has access to this branch
    const { data: branch } = await (supabase
      .from("branches")
      .select("org_id, name")
      .eq("id", branchId)
      .single() as any);

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const { data: membership } = await (supabase
      .from("org_members")
      .select("role")
      .eq("org_id", branch.org_id)
      .eq("user_id", user.id)
      .single() as any);

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse the file
    const buffer = await file.arrayBuffer();
    const parseResult = parseScheduleFile(buffer, file.name);

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: "File contains invalid rows",
          errors: parseResult.errors.slice(0, 20),
        },
        { status: 422 },
      );
    }

    if (parseResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No valid schedule records found in the file" },
        { status: 422 },
      );
    }

    // Delete existing schedules for this branch and replace
    const { error: deleteError } = await supabase
      .from("shift_schedules")
      .delete()
      .eq("branch_id", branchId);

    if (deleteError) throw deleteError;

    // Insert new schedules
    const recordsToInsert = parseResult.rows.map((r: any) => ({
      branch_id: branchId,
      employee_id: r.employee_id,
      scheduled_date: r.scheduled_date,
      scheduled_start: r.scheduled_start,
      scheduled_end: r.scheduled_end,
    }));

    const { error: insertError } = await (supabase
      .from("shift_schedules")
      .insert(recordsToInsert as never[]) as any);

    if (insertError) throw insertError;

    // Fetch existing attendance records for this branch to run reconciliation
    const { data: attendanceRecords } = await (supabase
      .from("attendance_records")
      .select("*")
      .eq("branch_id", branchId) as any);

    // Clear existing reconciliation flags for this branch, then run engine
    await supabase
      .from("reconciliation_flags")
      .delete()
      .eq("branch_id", branchId)
      .eq("org_id", branch.org_id);

    let flagsCount = 0;
    if (attendanceRecords && attendanceRecords.length > 0) {
      const attendanceRows = attendanceRecords.map((a: any) => ({
        employee_id: a.employee_id,
        employee_name: a.employee_name,
        timestamp: a.timestamp,
        check_type: a.check_type as "in" | "out",
        raw: {} as Record<string, unknown>,
      }));

      const flags = runReconciliation(
        branch.org_id,
        branchId,
        attendanceRows,
        parseResult.rows,
      );

      if (flags.length > 0) {
        const { error: flagError } = await (supabase
          .from("reconciliation_flags")
          .insert(flags as never[]) as any);

        if (flagError) throw flagError;
        flagsCount = flags.length;
      }
    }

    // Check alert rules and fire emails for new flags
    let alertsFired = 0;
    if (flagsCount > 0) {
      try {
        const result = await checkAndFireAlerts(branch.org_id, branchId);
        alertsFired = result.fired;
      } catch (alertErr) {
        console.error("Alert check failed (non-blocking):", alertErr);
      }
    }

    return NextResponse.json({
      schedules_imported: parseResult.rows.length,
      flags_generated: flagsCount,
      alerts_fired: alertsFired,
    });
  } catch (err: any) {
    console.error("Schedule import error:", err);
    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500 },
    );
  }
}
