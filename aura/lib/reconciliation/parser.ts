import Papa from "papaparse";
import * as XLSX from "xlsx";

import type {
  AttendanceRow,
  ParseError,
  ParseResult,
  ScheduleRow,
} from "./types";

/**
 * Parse a CSV or Excel file containing attendance data.
 * Expected columns: employee_id, employee_name (optional), timestamp, check_type
 */
export function parseAttendanceFile(
  fileBuffer: ArrayBuffer,
  fileName: string,
): ParseResult<AttendanceRow> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const errors: ParseError[] = [];
  let rawRows: Record<string, unknown>[] = [];

  if (ext === "csv") {
    const text = new TextDecoder("utf-8").decode(fileBuffer);
    const result = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (result.errors.length > 0) {
      for (const e of result.errors) {
        errors.push({
          row: (e.row ?? 0) + 1,
          message: e.message,
        });
      }
    }
    rawRows = result.data;
  } else if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      errors.push({ row: 0, message: "Excel file has no sheets" });
      return { rows: [], errors };
    }
    const sheet = workbook.Sheets[sheetName];
    rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  } else {
    errors.push({ row: 0, message: `Unsupported file type: .${ext}` });
    return { rows: [], errors };
  }

  const rows: AttendanceRow[] = [];

  // Normalise header names to lowercase
  const normalised = rawRows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key.toLowerCase().trim()] = value;
    }
    return out;
  });

  for (let i = 0; i < normalised.length; i++) {
    const r = normalised[i];
    const rowNum = i + 2; // 1-indexed + header row

    const employeeId = String(r.employee_id ?? "").trim();
    if (!employeeId) {
      errors.push({ row: rowNum, message: "Missing employee_id" });
      continue;
    }

    const timestamp = String(r.timestamp ?? "").trim();
    if (!timestamp) {
      errors.push({ row: rowNum, message: "Missing timestamp" });
      continue;
    }

    // Try to parse the timestamp
    const parsedTs = new Date(timestamp);
    if (isNaN(parsedTs.getTime())) {
      errors.push({
        row: rowNum,
        message: `Invalid timestamp: "${timestamp}"`,
        column: "timestamp",
      });
      continue;
    }

    const checkTypeRaw = String(r.check_type ?? "").toLowerCase().trim();
    if (checkTypeRaw !== "in" && checkTypeRaw !== "out") {
      errors.push({
        row: rowNum,
        message: `Invalid check_type: "${checkTypeRaw}". Must be "in" or "out".`,
        column: "check_type",
      });
      continue;
    }

    rows.push({
      employee_id: employeeId,
      employee_name: r.employee_name ? String(r.employee_name).trim() : null,
      timestamp: parsedTs.toISOString(),
      check_type: checkTypeRaw as "in" | "out",
      raw: r as Record<string, unknown>,
    });
  }

  return { rows, errors };
}

/**
 * Parse a CSV or Excel file containing shift schedules.
 * Expected columns: employee_id, scheduled_date, scheduled_start, scheduled_end
 */
export function parseScheduleFile(
  fileBuffer: ArrayBuffer,
  fileName: string,
): ParseResult<ScheduleRow> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const errors: ParseError[] = [];
  let rawRows: Record<string, unknown>[] = [];

  if (ext === "csv") {
    const text = new TextDecoder("utf-8").decode(fileBuffer);
    const result = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (result.errors.length > 0) {
      for (const e of result.errors) {
        errors.push({
          row: (e.row ?? 0) + 1,
          message: e.message,
        });
      }
    }
    rawRows = result.data;
  } else if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      errors.push({ row: 0, message: "Excel file has no sheets" });
      return { rows: [], errors };
    }
    const sheet = workbook.Sheets[sheetName];
    rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  } else {
    errors.push({ row: 0, message: `Unsupported file type: .${ext}` });
    return { rows: [], errors };
  }

  const rows: ScheduleRow[] = [];

  // Normalise header names
  const normalised = rawRows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key.toLowerCase().trim()] = value;
    }
    return out;
  });

  for (let i = 0; i < normalised.length; i++) {
    const r = normalised[i];
    const rowNum = i + 2;

    const employeeId = String(r.employee_id ?? "").trim();
    if (!employeeId) {
      errors.push({ row: rowNum, message: "Missing employee_id" });
      continue;
    }

    const scheduledDate = String(r.scheduled_date ?? "").trim();
    if (!scheduledDate) {
      errors.push({ row: rowNum, message: "Missing scheduled_date" });
      continue;
    }

    // Validate date format
    const parsedDate = new Date(scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push({
        row: rowNum,
        message: `Invalid scheduled_date: "${scheduledDate}"`,
        column: "scheduled_date",
      });
      continue;
    }

    const scheduledStart = String(r.scheduled_start ?? "").trim();
    if (!scheduledStart) {
      errors.push({ row: rowNum, message: "Missing scheduled_start" });
      continue;
    }

    const scheduledEnd = String(r.scheduled_end ?? "").trim();
    if (!scheduledEnd) {
      errors.push({ row: rowNum, message: "Missing scheduled_end" });
      continue;
    }

    // Validate time format (HH:mm or HH:mm:ss)
    const timeRegex = /^\d{1,2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(scheduledStart)) {
      errors.push({
        row: rowNum,
        message: `Invalid scheduled_start format: "${scheduledStart}". Use HH:mm.`,
        column: "scheduled_start",
      });
      continue;
    }
    if (!timeRegex.test(scheduledEnd)) {
      errors.push({
        row: rowNum,
        message: `Invalid scheduled_end format: "${scheduledEnd}". Use HH:mm.`,
        column: "scheduled_end",
      });
      continue;
    }

    rows.push({
      employee_id: employeeId,
      scheduled_date: parsedDate.toISOString().split("T")[0],
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      raw: r as Record<string, unknown>,
    });
  }

  return { rows, errors };
}
