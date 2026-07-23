import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    // Create org
    const { data: org, error: orgError } = await (supabase
      .from("organizations")
      .insert({ name } as never)
      .select()
      .single() as any);

    if (orgError) throw orgError;

    // Add creator as admin
    const { error: memberError } = await (supabase.from("org_members").insert({
      org_id: org.id,
      user_id: user.id,
      role: "admin",
    } as never) as any);

    if (memberError) throw memberError;

    // Create initial free subscription
    const { error: subError } = await (supabase.from("subscriptions").insert({
      org_id: org.id,
      plan: "free",
      status: "active",
    } as never) as any);

    if (subError) throw subError;

    return NextResponse.json({ org });
  } catch (err: any) {
    console.error("Org creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create organization" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: orgs } = await (supabase
    .from("org_members")
    .select("org_id, role, organizations(*)")
    .eq("user_id", user.id) as any);

  return NextResponse.json({ orgs: orgs || [] });
}
