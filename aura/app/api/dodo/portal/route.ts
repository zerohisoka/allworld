import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getDodo } from "@/lib/dodo/client";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { org_id } = await request.json();

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id is required" },
        { status: 400 },
      );
    }

    const { data: membership } = await (supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single() as any);

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: org } = await (supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", org_id)
      .single() as any);

    if (!org?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 },
      );
    }

    const dodo = getDodo();
    const session = await dodo.customers.customerPortal.create(
      org.stripe_customer_id,
    );

    return NextResponse.json({ url: session.link });
  } catch (err: any) {
    console.error("Failed to create portal session:", err);
    return NextResponse.json(
      { error: "Could not open subscription management. Please try again." },
      { status: 500 },
    );
  }
}
