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
    .select("org_id")
    .eq("user_id", user.id) as any);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ history: [] });
  }

  const orgIds = memberships.map((m: { org_id: string }) => m.org_id);

  const { data: history, error } = await (supabase
    .from("alert_history")
    .select("*, alerts(name, branch_id, branches(name))")
    .in("org_id", orgIds)
    .order("fired_at", { ascending: false })
    .limit(100) as any);

  if (error) {
    console.error("Alert history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert history" },
      { status: 500 },
    );
  }

  return NextResponse.json({ history: history || [] });
}
