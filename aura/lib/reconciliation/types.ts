/** Expected CSV column headers for attendance exports */
export const ATTENDANCE_EXPECTED_HEADERS = [
  "employee_id",
  "employee_name",
  "timestamp",
  "check_type",
] as const;

/** Expected CSV column headers for shift schedules */
export const SCHEDULE_EXPECTED_HEADERS = [
  "employee_id",
  "scheduled_date",
  "scheduled_start",
  "scheduled_end",
] as const;

export type AttendanceRow = {
  employee_id: string;
  employee_name: string | null;
  timestamp: string; // ISO 8601
  check_type: "in" | "out";
  raw: Record<string, unknown>;
};

export type ScheduleRow = {
  employee_id: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_start: string; // HH:mm
  scheduled_end: string; // HH:mm
  raw: Record<string, unknown>;
};

export type ParseResult<T> = {
  rows: T[];
  errors: ParseError[];
};

export type ParseError = {
  row: number;
  message: string;
  column?: string;
};

export type VarianceType =
  | "late_checkin"
  | "missed_shift"
  | "duplicate_punch"
  | "unscheduled_attendance"
  | "early_checkout";

export type ReconciliationFlag = {
  org_id: string;
  branch_id: string;
  employee_id: string;
  employee_name: string | null;
  flag_date: string;
  variance_type: VarianceType;
  variance_percent: number;
  severity: 1 | 2 | 3;
  attendance_record_id?: string;
  shift_schedule_id?: string;
  notes?: string;
};

/**
 * Given minutes of variance and shift length in minutes,
 * compute a severity level.
 */
export function computeSeverity(
  variancePercent: number,
  varianceType: VarianceType,
): 1 | 2 | 3 {
  // Missed shifts and unscheduled attendance always get high severity
  if (
    varianceType === "missed_shift" ||
    varianceType === "unscheduled_attendance"
  ) {
    return 3;
  }
  if (varianceType === "duplicate_punch") {
    return 2;
  }
  if (variancePercent < 10) return 1;
  if (variancePercent < 30) return 2;
  return 3;
}
