import { createClient } from "@/lib/supabase/server";
import { getPlanLimits } from "@/lib/dodo/plans";

export type QuotaAction =
  | "create_branch"
  | "create_alert_rule"
  | "invite_member";

interface QuotaCheck {
  allowed: boolean;
  limit: number | "unlimited";
  current: number;
  plan: string;
}

/**
 * Check if an org has capacity for a specific action based on their plan limits.
 * Call this from server-side API routes before allowing the operation.
 */
export async function checkQuota(
  orgId: string,
  action: QuotaAction,
): Promise<QuotaCheck> {
  const supabase = await createClient();

  // Get org plan
  const { data: org } = await supabase
    .from("organizations")
    .select("plan_tier")
    .eq("id", orgId)
    .single();

  const plan = org?.plan_tier || "free";
  const limits = getPlanLimits(plan);

  let current = 0;

  switch (action) {
    case "create_branch": {
      const limit = limits.branches;
      if (limit === "unlimited") {
        return { allowed: true, limit, current: 0, plan };
      }

      const { count } = await supabase
        .from("branches")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId);

      current = count || 0;
      return {
        allowed: current < limit,
        limit,
        current,
        plan,
      };
    }

    case "create_alert_rule": {
      const limit = limits.alertRules;
      if (limit === "unlimited") {
        return { allowed: true, limit, current: 0, plan };
      }

      const { count } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId);

      current = count || 0;
      return {
        allowed: current < limit,
        limit,
        current,
        plan,
      };
    }

    case "invite_member": {
      const limit = limits.seats;
      if (limit === "unlimited") {
        return { allowed: true, limit, current: 0, plan };
      }

      const { count } = await supabase
        .from("org_members")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId);

      current = count || 0;
      return {
        allowed: current < limit,
        limit,
        current,
        plan,
      };
    }

    default:
      return { allowed: false, limit: 0, current: 0, plan };
  }
}
