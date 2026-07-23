import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { parseAttendanceFile } from "@/lib/reconciliation/parser";
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

    // Create import record
    const { data: importRecord, error: importError } = await (supabase
      .from("attendance_imports")
      .insert({
        branch_id: branchId,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: "",
        status: "processing",
      } as never)
      .select()
      .single() as any);

    if (importError) throw importError;

    // Parse the file
    const buffer = await file.arrayBuffer();
    const parseResult = parseAttendanceFile(buffer, file.name);

    if (parseResult.errors.length > 0) {
      // Update import record with error
      await (supabase
        .from("attendance_imports")
        .update({
          status: "failed",
          error_message: parseResult.errors
            .slice(0, 20)
            .map((e: any) => `Row ${e.row}: ${e.message}`)
            .join("; "),
          completed_at: new Date().toISOString(),
        } as never)
        .eq("id", importRecord.id) as any);

      return NextResponse.json(
        {
          error: "File contains invalid rows",
          errors: parseResult.errors.slice(0, 20),
          import_id: importRecord.id,
        },
        { status: 422 },
      );
    }

    if (parseResult.rows.length === 0) {
      await (supabase
        .from("attendance_imports")
        .update({
          status: "failed",
          error_message: "No valid attendance records found in the file",
          completed_at: new Date().toISOString(),
        } as never)
        .eq("id", importRecord.id) as any);

      return NextResponse.json(
        { error: "No valid records found in file", import_id: importRecord.id },
        { status: 422 },
      );
    }

    // Batch insert attendance records
    const recordsToInsert = parseResult.rows.map((r) => ({
      import_id: importRecord.id,
      branch_id: branchId,
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      timestamp: r.timestamp,
      check_type: r.check_type,
      raw_data: r.raw as Record<string, unknown>,
    }));

    const { error: insertError } = await (supabase
      .from("attendance_records")
      .insert(recordsToInsert as never[]) as any);

    if (insertError) throw insertError;

    // Fetch existing shift schedules for this branch to run reconciliation
    const { data: schedules } = await (supabase
      .from("shift_schedules")
      .select("*")
      .eq("branch_id", branchId) as any);

    // Clear existing reconciliation flags for this branch, then run engine
    await supabase
      .from("reconciliation_flags")
      .delete()
      .eq("branch_id", branchId)
      .eq("org_id", branch.org_id);

    let flagsCount = 0;
    if (schedules && schedules.length > 0) {
      const scheduleRows = schedules.map((s: any) => ({
        employee_id: s.employee_id,
        scheduled_date: s.scheduled_date,
        scheduled_start: s.scheduled_start,
        scheduled_end: s.scheduled_end,
        raw: {} as Record<string, unknown>,
      }));

      const flags = runReconciliation(
        branch.org_id,
        branchId,
        parseResult.rows,
        scheduleRows,
      );

      if (flags.length > 0) {
        const { error: flagError } = await (supabase
          .from("reconciliation_flags")
          .insert(flags as never[]) as any);

        if (flagError) throw flagError;
        flagsCount = flags.length;
      }
    }

    // Update import record as completed
    await (supabase
      .from("attendance_imports")
      .update({
        status: "completed",
        record_count: parseResult.rows.length,
        completed_at: new Date().toISOString(),
      } as never)
      .eq("id", importRecord.id) as any);

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
      import_id: importRecord.id,
      records_imported: parseResult.rows.length,
      flags_generated: flagsCount,
      alerts_fired: alertsFired,
    });
  } catch (err: any) {
    console.error("Attendance import error:", err);
    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500 },
    );
  }
}
