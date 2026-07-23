import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: alert } = await (supabase
    .from("alerts")
    .select("org_id")
    .eq("id", id)
    .single() as any);

  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  const { data: membership } = await (supabase
    .from("org_members")
    .select("role")
    .eq("org_id", alert.org_id)
    .eq("user_id", user.id)
    .single() as any);

  if (!membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const updates = await request.json();
    const { error: updateError } = await (supabase
      .from("alerts")
      .update({
        name: updates.name,
        description: updates.description,
        rule_conditions: updates.rule_conditions,
        enabled: updates.enabled,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id) as any);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update alert" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: alert } = await (supabase
    .from("alerts")
    .select("org_id")
    .eq("id", id)
    .single() as any);

  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  const { data: membership } = await (supabase
    .from("org_members")
    .select("role")
    .eq("org_id", alert.org_id)
    .eq("user_id", user.id)
    .single() as any);

  if (!membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { error: deleteError } = await (supabase
    .from("alerts")
    .delete()
    .eq("id", id) as any);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
