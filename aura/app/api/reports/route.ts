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
    return NextResponse.json({ reports: [] });
  }

  const orgIds = memberships.map((m: { org_id: string }) => m.org_id);

  const { data: reports, error } = await (supabase
    .from("reports")
    .select("*")
    .in("org_id", orgIds)
    .order("created_at", { ascending: false })
    .limit(50) as any);

  if (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }

  return NextResponse.json({ reports: reports || [] });
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
    const { org_id, branch_id, type, title, date_range_start, date_range_end } =
      await request.json();

    if (!org_id || !title || !type) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: org_id, title, and type are required",
        },
        { status: 400 },
      );
    }

    // Verify user belongs to this org
    const { data: membership } = await (supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single() as any);

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create the report record
    const { data: report, error: insertError } = await (supabase
      .from("reports")
      .insert({
        org_id,
        branch_id: branch_id || null,
        title,
        type: type as "reconciliation" | "variance" | "summary",
        status: "generating",
        date_range_start: date_range_start || null,
        date_range_end: date_range_end || null,
        created_by: user.id,
      } as never)
      .select()
      .single() as any);

    if (insertError) throw insertError;

    // For now, mark as ready immediately since we're not doing async generation
    // In production, this would kick off a background job
    await (supabase
      .from("reports")
      .update({
        status: "ready",
        file_type: "csv",
      } as never)
      .eq("id", report.id) as any);

    return NextResponse.json({ report: { ...report, status: "ready", file_type: "csv" } });
  } catch (err: any) {
    console.error("Report generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate report" },
      { status: 500 },
    );
  }
}
