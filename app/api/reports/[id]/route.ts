import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  const { data: report, error } = await (supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single() as any);

  if (error || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Verify access
  const { data: membership } = await (supabase
    .from("org_members")
    .select("role")
    .eq("org_id", report.org_id)
    .eq("user_id", user.id)
    .single() as any);

  if (!membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({ report });
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

  const { data: report } = await (supabase
    .from("reports")
    .select("org_id")
    .eq("id", id)
    .single() as any);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { data: membership } = await (supabase
    .from("org_members")
    .select("role")
    .eq("org_id", report.org_id)
    .eq("user_id", user.id)
    .single() as any);

  if (!membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { error: deleteError } = await (supabase
    .from("reports")
    .delete()
    .eq("id", id) as any);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
