import type {
  AttendanceRow,
  ReconciliationFlag,
  ScheduleRow,
  VarianceType,
} from "./types";
import { computeSeverity } from "./types";

/**
 * The reconciliation engine.
 *
 * Takes an org_id, branch_id, an array of attendance records, and an array
 * of shift schedules, and produces reconciliation_flags for every variance
 * it finds.
 *
 * Matching strategy:
 * 1. For each attendance record, find the matching shift schedule for that
 *    employee on that date.
 * 2. Classify the variance type and compute severity.
 * 3. Also flag employees who had a scheduled shift but no attendance records.
 */

type AttendanceByDay = Map<
  string, // employee_id
  Map<
    string, // date (YYYY-MM-DD)
    AttendanceRow[]
  >
>;

type ScheduleByDay = Map<
  string, // employee_id
  Map<
    string, // date (YYYY-MM-DD)
    ScheduleRow[]
  >
>;

function groupAttendanceByDay(
  records: AttendanceRow[],
): AttendanceByDay {
  const map: AttendanceByDay = new Map();
  for (const r of records) {
    const date = new Date(r.timestamp).toISOString().split("T")[0];
    if (!map.has(r.employee_id)) {
      map.set(r.employee_id, new Map());
    }
    const dayMap = map.get(r.employee_id)!;
    if (!dayMap.has(date)) {
      dayMap.set(date, []);
    }
    dayMap.get(date)!.push(r);
  }
  return map;
}

function groupSchedulesByDay(
  schedules: ScheduleRow[],
): ScheduleByDay {
  const map: ScheduleByDay = new Map();
  for (const s of schedules) {
    if (!map.has(s.employee_id)) {
      map.set(s.employee_id, new Map());
    }
    const dayMap = map.get(s.employee_id)!;
    if (!dayMap.has(s.scheduled_date)) {
      dayMap.set(s.scheduled_date, []);
    }
    dayMap.get(s.scheduled_date)!.push(s);
  }
  return map;
}

/** Convert a HH:mm string to total minutes since midnight */
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/** Compute shift length in minutes */
function shiftLengthMinutes(start: string, end: string): number {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  // Handle overnight shifts
  return endMin >= startMin ? endMin - startMin : 24 * 60 - startMin + endMin;
}

export function runReconciliation(
  orgId: string,
  branchId: string,
  attendanceRecords: AttendanceRow[],
  schedules: ScheduleRow[],
): ReconciliationFlag[] {
  const flags: ReconciliationFlag[] = [];
  const attendanceByDay = groupAttendanceByDay(attendanceRecords);
  const schedulesByDay = groupSchedulesByDay(schedules);

  // Track which (employee, date) pairs were matched
  const matched = new Set<string>();

  // ── Step 1: Match attendance records against schedules ──
  for (const [employeeId, dayMap] of attendanceByDay) {
    for (const [date, records] of dayMap) {
      const daySchedules = schedulesByDay.get(employeeId)?.get(date) || [];

      // Separate in/out records
      const inRecords = records.filter((r) => r.check_type === "in");
      const outRecords = records.filter((r) => r.check_type === "out");

      if (daySchedules.length > 0) {
        // Employee has a schedule — check each scheduled shift
        for (const schedule of daySchedules) {
          const shiftStartMin = timeToMinutes(schedule.scheduled_start);
          const shiftEndMin = timeToMinutes(schedule.scheduled_end);
          const shiftLen = shiftLengthMinutes(
            schedule.scheduled_start,
            schedule.scheduled_end,
          );
          const employeeName =
            records.find((r) => r.employee_name)?.employee_name || null;

          matched.add(`${employeeId}:${date}`);

          // Check for late check-in (no "in" record, or first "in" is late)
          if (inRecords.length === 0) {
            // No check-in at all — partial missed shift
            flags.push({
              org_id: orgId,
              branch_id: branchId,
              employee_id: employeeId,
              employee_name: employeeName,
              flag_date: date,
              variance_type: "missed_shift",
              variance_percent: 100,
              severity: 3,
              notes: `No check-in recorded for scheduled shift ${schedule.scheduled_start}-${schedule.scheduled_end}`,
              shift_schedule_id: undefined,
            });
          } else {
            // Find the first in-record within a reasonable window (before or up to 30min after start)
            const sortedIn = [...inRecords].sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
            );
            const firstIn = sortedIn[0];
            const inTime = new Date(firstIn.timestamp);
            const inMinutes = inTime.getHours() * 60 + inTime.getMinutes();
            const diff = inMinutes - shiftStartMin;

            if (diff > 5) {
              // More than 5 min late
              const variancePct = shiftLen > 0 ? (diff / shiftLen) * 100 : 10;
              flags.push({
                org_id: orgId,
                branch_id: branchId,
                employee_id: employeeId,
                employee_name: employeeName,
                flag_date: date,
                variance_type: "late_checkin",
                variance_percent: Math.min(
                  Math.round(variancePct * 100) / 100,
                  100,
                ),
                severity: computeSeverity(variancePct, "late_checkin"),
                attendance_record_id: undefined,
                shift_schedule_id: undefined,
                notes: `Checked in ${Math.round(diff)} minutes late (scheduled: ${schedule.scheduled_start})`,
              });
            }

            // Check for early check-out (last "out" record is before end)
            if (outRecords.length > 0) {
              const sortedOut = [...outRecords].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime(),
              );
              const lastOut = sortedOut[sortedOut.length - 1];
              const outTime = new Date(lastOut.timestamp);
              const outMinutes =
                outTime.getHours() * 60 + outTime.getMinutes();
              const outDiff = shiftEndMin - outMinutes;

              if (outDiff > 5) {
                // More than 5 min early
                const variancePct =
                  shiftLen > 0 ? (outDiff / shiftLen) * 100 : 10;
                flags.push({
                  org_id: orgId,
                  branch_id: branchId,
                  employee_id: employeeId,
                  employee_name: employeeName,
                  flag_date: date,
                  variance_type: "early_checkout",
                  variance_percent: Math.min(
                    Math.round(variancePct * 100) / 100,
                    100,
                  ),
                  severity: computeSeverity(variancePct, "early_checkout"),
                  attendance_record_id: undefined,
                  shift_schedule_id: undefined,
                  notes: `Checked out ${Math.round(outDiff)} minutes early (scheduled: ${schedule.scheduled_end})`,
                });
              }
            }
          }

          // Check for duplicate punches (multiple in or out records)
          if (inRecords.length > 1) {
            flags.push({
              org_id: orgId,
              branch_id: branchId,
              employee_id: employeeId,
              employee_name: employeeName,
              flag_date: date,
              variance_type: "duplicate_punch",
              variance_percent: 0,
              severity: 2,
              notes: `${inRecords.length} check-in records found for the same shift`,
            });
          }
          if (outRecords.length > 1) {
            flags.push({
              org_id: orgId,
              branch_id: branchId,
              employee_id: employeeId,
              employee_name: employeeName,
              flag_date: date,
              variance_type: "duplicate_punch",
              variance_percent: 0,
              severity: 2,
              notes: `${outRecords.length} check-out records found for the same shift`,
            });
          }
        }
      } else {
        // Employee has attendance but no schedule — unscheduled attendance
        const employeeName =
          records.find((r) => r.employee_name)?.employee_name || null;
        flags.push({
          org_id: orgId,
          branch_id: branchId,
          employee_id: employeeId,
          employee_name: employeeName,
          flag_date: date,
          variance_type: "unscheduled_attendance",
          variance_percent: 0,
          severity: 3,
          notes: `${records.length} attendance record(s) found with no matching shift schedule`,
        });
      }
    }
  }

  // ── Step 2: Find scheduled employees who never clocked in ──
  for (const [employeeId, dayMap] of schedulesByDay) {
    for (const [date] of dayMap) {
      const key = `${employeeId}:${date}`;
      if (!matched.has(key)) {
        const schedules = dayMap.get(date) || [];
        const schedule = schedules[0];
        flags.push({
          org_id: orgId,
          branch_id: branchId,
          employee_id: employeeId,
          employee_name: null,
          flag_date: date,
          variance_type: "missed_shift",
          variance_percent: 100,
          severity: 3,
          notes: `Scheduled for shift ${schedule.scheduled_start}-${schedule.scheduled_end} but no attendance records found`,
          shift_schedule_id: undefined,
        });
      }
    }
  }

  return flags;
}
