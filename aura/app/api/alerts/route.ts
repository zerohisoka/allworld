import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: memberships } = await (supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id) as any);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ alerts: [], firing_count: 0 });
  }

  const orgIds = memberships.map((m: { org_id: string }) => m.org_id);

  const { data: alerts, error } = await supabase
    .from("alerts")
    .select("*")
    .in("org_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Alerts fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 },
    );
  }

  // Get total firing count across all alerts
  const { data: history } = await (supabase
    .from("alert_history")
    .select("alert_id")
    .in("org_id", orgIds) as any);

  const firingCount = history?.length || 0;

  return NextResponse.json({ alerts: alerts || [], firing_count: firingCount });
}

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
    const { org_id, branch_id, name, description, rule_conditions } =
      await request.json();

    if (!org_id || !name) {
      return NextResponse.json(
        { error: "org_id and name are required" },
        { status: 400 },
      );
    }

    // Verify user belongs to this org
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single()
      .returns<{ role: string }>();

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check alert rule quota
    const { checkQuota } = await import("@/lib/quota");
    const quota = await checkQuota(org_id, "create_alert_rule");
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Alert rule limit reached (${quota.current}/${quota.limit}). Upgrade your plan to add more rules.`,
        },
        { status: 403 },
      );
    }

    const { data: alert, error: insertError } = await (supabase
      .from("alerts")
      .insert({
        org_id,
        branch_id: branch_id || null,
        name,
        description: description || null,
        rule_conditions: rule_conditions || {},
        created_by: user.id,
      } as never)
      .select()
      .single() as any);

    if (insertError) throw insertError;

    return NextResponse.json({ alert });
  } catch (err: any) {
    console.error("Alert creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create alert" },
      { status: 500 },
    );
  }
}
