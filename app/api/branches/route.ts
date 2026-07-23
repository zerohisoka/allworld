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

  // Get the user's orgs
  const { data: memberships } = (await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)) as any;

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ branches: [] });
  }

  const orgIds = memberships.map((m: { org_id: string }) => m.org_id);

  const { data: branches, error } = await supabase
    .from("branches")
    .select("*")
    .in("org_id", orgIds)
    .order("name");

  if (error) {
    console.error("Branches fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 },
    );
  }

  return NextResponse.json({ branches: branches || [] });
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
    const { name, region, org_id } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Branch name is required" },
        { status: 400 },
      );
    }

    // Verify user is admin/executive of the org
    const { data: membership } = (await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single()) as any;

    if (
      !membership ||
      (membership.role !== "admin" && membership.role !== "executive")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Check branch quota
    const { checkQuota } = await import("@/lib/quota");
    const quota = await checkQuota(org_id, "create_branch");
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Branch limit reached (${quota.current}/${quota.limit}). Upgrade your plan to add more branches.`,
        },
        { status: 403 },
      );
    }

    const { data: branch, error } = await (supabase
      .from("branches")
      .insert({ org_id, name, region: region || null } as never)
      .select()
      .single() as any);

    if (error) throw error;

    return NextResponse.json({ branch });
  } catch (err: any) {
    console.error("Branch creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create branch" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { branch_id } = await request.json();

    if (!branch_id) {
      return NextResponse.json(
        { error: "Branch ID is required" },
        { status: 400 },
      );
    }

    // Verify user is admin of the org that owns the branch
    const { data: branch } = (await supabase
      .from("branches")
      .select("org_id")
      .eq("id", branch_id)
      .single()) as any;

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const { data: membership } = (await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", branch.org_id)
      .eq("user_id", user.id)
      .single()) as any;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", branch_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Branch deletion error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete branch" },
      { status: 500 },
    );
  }
}
