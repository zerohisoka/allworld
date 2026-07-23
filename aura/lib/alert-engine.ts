import { createClient } from "@supabase/supabase-js";

import { sendAlertEmail } from "@/lib/email/resend";

/**
 * Check reconciliation flags against alert rules for an org, fire matching alerts.
 * Runs inside the import flow (non-blocking — failures are logged, never thrown).
 */
export async function checkAndFireAlerts(
  orgId: string,
  branchId: string | null,
): Promise<{ fired: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Fetch enabled alert rules for this org (and optionally this branch)
  let alertsQuery = supabase
    .from("alerts")
    .select("*, branches(name)")
    .eq("org_id", orgId)
    .eq("enabled", true);

  if (branchId) {
    alertsQuery = alertsQuery.or(`branch_id.eq.${branchId},branch_id.is.null`);
  }

  const { data: alertRules } = await alertsQuery;

  if (!alertRules || alertRules.length === 0) {
    return { fired: 0 };
  }

  // Fetch unresolved flags for this org/branch
  let flagsQuery = supabase
    .from("reconciliation_flags")
    .select("*")
    .eq("org_id", orgId)
    .eq("resolved", false);

  if (branchId) {
    flagsQuery = flagsQuery.eq("branch_id", branchId);
  }

  const { data: flags } = await flagsQuery;

  if (!flags || flags.length === 0) {
    return { fired: 0 };
  }

  // Fetch org members to get email addresses
  const { data: members } = await supabase
    .from("org_members")
    .select("user_id, users:auth.users!inner(email)")
    .eq("org_id", orgId)
    .returns<{ user_id: string; users: { email: string } | null }[]>();

  const memberEmails: string[] = [];
  if (members) {
    for (const m of members) {
      const userData = m.users;
      if (userData?.email) {
        memberEmails.push(userData.email);
      }
    }
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let fired = 0;

  // For each alert rule, check if any flags match its conditions
  for (const rule of alertRules) {
    const conditions = rule.rule_conditions as Record<string, any>;
    const varianceType = conditions?.variance_type;
    const threshold = conditions?.threshold_percent || 0;

    const matchingFlags = flags.filter((f) => {
      if (varianceType && f.variance_type !== varianceType) return false;
      if (threshold > 0 && f.variance_percent < threshold) return false;
      return true;
    });

    if (matchingFlags.length === 0) continue;

    // Log to alert_history
    const historyEntries = matchingFlags.slice(0, 10).map((f) => ({
      alert_id: rule.id,
      org_id: orgId,
      branch_id: f.branch_id,
      details: {
        variance_type: f.variance_type,
        variance_percent: f.variance_percent,
        severity: f.severity,
        employee_id: f.employee_id,
        flag_id: f.id,
      },
    }));

    const { error: historyError } = await supabase
      .from("alert_history")
      .insert(historyEntries);

    if (historyError) {
      console.error("Failed to insert alert history:", historyError);
      continue;
    }

    // Update alert's last_fired_at
    await supabase
      .from("alerts")
      .update({ last_fired_at: new Date().toISOString() })
      .eq("id", rule.id);

    fired++;

    // Send email to all org members
    const branchName =
      (rule.branches as unknown as { name: string } | null)?.name ||
      branchId ||
      "Unknown";
    const description = `${matchingFlags.length} flag(s) matched rule "${rule.name}" (${varianceType || "any"} ≥ ${threshold}%).`;

    for (const email of memberEmails) {
      try {
        await sendAlertEmail(
          email,
          rule.name,
          branchName,
          description,
          appUrl,
        );
      } catch (emailErr) {
        console.error(`Failed to send alert email to ${email}:`, emailErr);
      }
    }
  }

  return { fired };
}
