/* ============================================================
   AURA — Database Row Types
   Mirrors the schema from supabase/migrations/001_initial_schema.sql
   ============================================================ */

export interface OrganizationRow {
  id: string;
  name: string;
  plan_tier: "free" | "starter" | "growth" | "enterprise";
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgMemberRow {
  id: string;
  org_id: string;
  user_id: string;
  role: "admin" | "executive" | "branch_manager";
  created_at: string;
  organizations?: { name: string } | OrganizationRow;
}

export interface BranchRow {
  id: string;
  org_id: string;
  name: string;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceImportRow {
  id: string;
  branch_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  record_count: number | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AttendanceRecordRow {
  id: string;
  import_id: string;
  branch_id: string;
  employee_id: string;
  employee_name: string | null;
  timestamp: string;
  check_type: "in" | "out";
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface ShiftScheduleRow {
  id: string;
  branch_id: string;
  employee_id: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationFlagRow {
  id: string;
  org_id: string;
  branch_id: string;
  employee_id: string;
  employee_name: string | null;
  flag_date: string;
  variance_type:
    | "late_checkin"
    | "missed_shift"
    | "duplicate_punch"
    | "unscheduled_attendance"
    | "early_checkout";
  variance_percent: number;
  severity: 1 | 2 | 3;
  resolved: boolean;
  attendance_record_id: string | null;
  shift_schedule_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportRow {
  id: string;
  org_id: string;
  branch_id: string | null;
  title: string;
  type: "reconciliation" | "variance" | "summary";
  status: "generating" | "ready" | "failed";
  file_path: string | null;
  file_type: "pdf" | "csv" | null;
  date_range_start: string | null;
  date_range_end: string | null;
  created_by: string;
  created_at: string;
}

export interface AlertRow {
  id: string;
  org_id: string;
  branch_id: string | null;
  name: string;
  description: string | null;
  rule_conditions: Record<string, unknown>;
  enabled: boolean;
  last_fired_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AlertHistoryRow {
  id: string;
  alert_id: string;
  org_id: string;
  branch_id: string | null;
  fired_at: string;
  details: Record<string, unknown> | null;
  alerts?: { name: string; branch_id: string; branches?: { name: string } };
}

export interface SubscriptionRow {
  id: string;
  org_id: string;
  plan: "free" | "starter" | "growth" | "enterprise";
  status: "active" | "past_due" | "canceled" | "expired";
  stripe_customer_id: string | null;
  subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

/* ============================================================
   Supabase type — passed as generic to createClient<Database>()
   so that .from() returns properly typed query builders.
   ============================================================ */
export type Database = {
  public: {
    Tables: {
      organizations: { Row: OrganizationRow; Insert: Partial<OrganizationRow>; Update: Partial<OrganizationRow> };
      org_members: { Row: OrgMemberRow; Insert: Partial<OrgMemberRow>; Update: Partial<OrgMemberRow> };
      branches: { Row: BranchRow; Insert: Partial<BranchRow>; Update: Partial<BranchRow> };
      attendance_imports: { Row: AttendanceImportRow; Insert: Partial<AttendanceImportRow>; Update: Partial<AttendanceImportRow> };
      attendance_records: { Row: AttendanceRecordRow; Insert: Partial<AttendanceRecordRow>; Update: Partial<AttendanceRecordRow> };
      shift_schedules: { Row: ShiftScheduleRow; Insert: Partial<ShiftScheduleRow>; Update: Partial<ShiftScheduleRow> };
      reconciliation_flags: { Row: ReconciliationFlagRow; Insert: Partial<ReconciliationFlagRow>; Update: Partial<ReconciliationFlagRow> };
      reports: { Row: ReportRow; Insert: Partial<ReportRow>; Update: Partial<ReportRow> };
      alerts: { Row: AlertRow; Insert: Partial<AlertRow>; Update: Partial<AlertRow> };
      alert_history: { Row: AlertHistoryRow; Insert: Partial<AlertHistoryRow>; Update: Partial<AlertHistoryRow> };
      subscriptions: { Row: SubscriptionRow; Insert: Partial<SubscriptionRow>; Update: Partial<SubscriptionRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
