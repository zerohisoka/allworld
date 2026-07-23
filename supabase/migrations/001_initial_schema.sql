-- ============================================================
-- AURA — Automated MIS Intelligence
-- Migration 001: Initial schema with Row-Level Security
-- ============================================================

-- ── Organizations ───────────────────────────────────────────
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  plan_tier     TEXT NOT NULL DEFAULT 'free'
                  CHECK (plan_tier IN ('free','starter','growth','enterprise')),
  stripe_customer_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Org admins can read their own org; service role does bulk reads.
CREATE POLICY "org_select_own" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_update_own" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── Org Members ─────────────────────────────────────────────
CREATE TABLE org_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'admin'
               CHECK (role IN ('admin','executive','branch_manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members in their orgs.
CREATE POLICY "members_select_own" ON org_members
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Admins can invite / change roles.
CREATE POLICY "members_insert_admin" ON org_members
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "members_update_admin" ON org_members
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "members_delete_admin" ON org_members
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Auto-insert the creating user as admin on signup (handled by trigger below).
CREATE OR REPLACE FUNCTION public.handle_new_org_and_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Create a personal org for the new user
  INSERT INTO organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email) || '''s Organization')
  RETURNING id INTO v_org_id;

  -- Add user as admin
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (v_org_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_org_and_member();

-- ── Branches ────────────────────────────────────────────────
CREATE TABLE branches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  region     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_select_own" ON branches
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "branches_insert_admin" ON branches
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('admin','executive')
    )
  );

CREATE POLICY "branches_update_admin" ON branches
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('admin','executive')
    )
  );

CREATE POLICY "branches_delete_admin" ON branches
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── Attendance Imports ──────────────────────────────────────
CREATE TABLE attendance_imports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES auth.users(id),
  file_name     TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  record_count  INTEGER,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','completed','failed')),
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

ALTER TABLE attendance_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imports_select_own" ON attendance_imports
  FOR SELECT USING (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN org_members om ON om.org_id = b.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "imports_insert" ON attendance_imports
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN org_members om ON om.org_id = b.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','executive','branch_manager')
    )
  );

-- ── Attendance Records ──────────────────────────────────────
CREATE TABLE attendance_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id     UUID NOT NULL REFERENCES attendance_imports(id) ON DELETE CASCADE,
  branch_id     UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  employee_id   TEXT NOT NULL,
  employee_name TEXT,
  timestamp     TIMESTAMPTZ NOT NULL,
  check_type    TEXT NOT NULL CHECK (check_type IN ('in','out')),
  raw_data      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "records_select_own" ON attendance_records
  FOR SELECT USING (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN org_members om ON om.org_id = b.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Inserted by the reconciliation engine (service role) or import parser.
CREATE POLICY "records_insert" ON attendance_records
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN org_members om ON om.org_id = b.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ── Shift Schedules ─────────────────────────────────────────
CREATE TABLE shift_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  employee_id     TEXT NOT NULL,
  scheduled_date  DATE NOT NULL,
  scheduled_start TIME NOT NULL,
  scheduled_end   TIME NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_select_own" ON shift_schedules
  FOR SELECT USING (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN org_members om ON om.org_id = b.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "schedules_insert" ON shift_schedules
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN org_members om ON om.org_id = b.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "schedules_update" ON shift_schedules
  FOR UPDATE USING (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN org_members om ON om.org_id = b.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "schedules_delete" ON shift_schedules
  FOR DELETE USING (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN org_members om ON om.org_id = b.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ── Reconciliation Flags ────────────────────────────────────
CREATE TABLE reconciliation_flags (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id             UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  employee_id           TEXT NOT NULL,
  employee_name         TEXT,
  flag_date             DATE NOT NULL,
  variance_type         TEXT NOT NULL
                          CHECK (variance_type IN (
                            'late_checkin','missed_shift','duplicate_punch',
                            'unscheduled_attendance','early_checkout'
                          )),
  variance_percent      NUMERIC(5,2) NOT NULL DEFAULT 0,
  severity              INTEGER NOT NULL DEFAULT 1 CHECK (severity IN (1,2,3)),
  resolved              BOOLEAN NOT NULL DEFAULT false,
  attendance_record_id  UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
  shift_schedule_id     UUID REFERENCES shift_schedules(id) ON DELETE SET NULL,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reconciliation_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flags_select_own" ON reconciliation_flags
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "flags_update" ON reconciliation_flags
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- ── Reports ─────────────────────────────────────────────────
CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id         UUID REFERENCES branches(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('reconciliation','variance','summary')),
  status            TEXT NOT NULL DEFAULT 'generating'
                      CHECK (status IN ('generating','ready','failed')),
  file_path         TEXT,
  file_type         TEXT CHECK (file_type IN ('pdf','csv')),
  date_range_start  DATE,
  date_range_end    DATE,
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_own" ON reports
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "reports_insert" ON reports
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- ── Alerts ──────────────────────────────────────────────────
CREATE TABLE alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id        UUID REFERENCES branches(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  rule_conditions  JSONB NOT NULL DEFAULT '{}',
  enabled          BOOLEAN NOT NULL DEFAULT true,
  last_fired_at    TIMESTAMPTZ,
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_own" ON alerts
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "alerts_insert" ON alerts
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "alerts_update" ON alerts
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "alerts_delete" ON alerts
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- ── Alert History ───────────────────────────────────────────
CREATE TABLE alert_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id   UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id  UUID REFERENCES branches(id) ON DELETE SET NULL,
  fired_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  details    JSONB
);

ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alert_history_select_own" ON alert_history
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- ── Subscriptions ───────────────────────────────────────────
CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'free'
                         CHECK (plan IN ('free','starter','growth','enterprise')),
  status               TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','past_due','canceled','expired')),
  stripe_customer_id   TEXT,
  subscription_id      TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_update_admin" ON subscriptions
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_branches_org_id ON branches(org_id);
CREATE INDEX idx_attendance_records_branch_id ON attendance_records(branch_id);
CREATE INDEX idx_attendance_records_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_shift_schedules_branch_id ON shift_schedules(branch_id);
CREATE INDEX idx_reconciliation_flags_org_id ON reconciliation_flags(org_id);
CREATE INDEX idx_reconciliation_flags_branch_id ON reconciliation_flags(branch_id);
CREATE INDEX idx_reconciliation_flags_resolved ON reconciliation_flags(resolved);
CREATE INDEX idx_reports_org_id ON reports(org_id);
CREATE INDEX idx_alerts_org_id ON alerts(org_id);
CREATE INDEX idx_alert_history_org_id ON alert_history(org_id);
CREATE INDEX idx_subscriptions_org_id ON subscriptions(org_id);

-- ── Helper: get current user's orgs ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_orgs()
RETURNS TABLE (
  org_id   UUID,
  org_name TEXT,
  role     TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT om.org_id, o.name, om.role
  FROM org_members om
  JOIN organizations o ON o.id = om.org_id
  WHERE om.user_id = auth.uid()
$$;

-- ── Helper: get org plan limits ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_org_plan(org_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT plan_tier FROM organizations WHERE id = org_id
$$;
