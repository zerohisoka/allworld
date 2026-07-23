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

  // Fetch org memberships
  const { data: memberships } = await (supabase
    .from("org_members")
    .select("id, org_id, role, organizations(name, plan_tier)")
    .eq("user_id", user.id) as any);

  // Fetch subscription info for each org
  const orgs = await Promise.all(
    (memberships || []).map(async (m: any) => {
      const org = m.organizations as { name: string; plan_tier: string };
      const { data: sub } = await (supabase
        .from("subscriptions")
        .select("*")
        .eq("org_id", m.org_id)
        .single() as any);

      return {
        membership_id: m.id,
        org_id: m.org_id,
        org_name: org?.name || "",
        role: m.role,
        plan_tier: org?.plan_tier || "free",
        subscription: sub || null,
      };
    }),
  );

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    },
    orgs,
  });
}
