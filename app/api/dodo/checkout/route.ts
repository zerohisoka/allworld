import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getDodo } from "@/lib/dodo/client";
import { PLANS, type PlanId } from "@/lib/dodo/plans";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, org_id, billingPeriod = "monthly" } = body;

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id is required" },
        { status: 400 },
      );
    }

    // Verify user is an admin of this org
    const { data: membership } = await (supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single() as any);

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only org admins can manage billing" },
        { status: 403 },
      );
    }

    if (
      plan !== "starter" &&
      plan !== "growth" &&
      plan !== "enterprise"
    ) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (billingPeriod !== "monthly" && billingPeriod !== "annual") {
      return NextResponse.json(
        { error: "Invalid billing period" },
        { status: 400 },
      );
    }

    const planConfig = PLANS[plan as PlanId];
    const productId =
      billingPeriod === "annual"
        ? planConfig.dodoAnnualProductId
        : planConfig.dodoProductId;

    if (!productId) {
      const missingVar =
        billingPeriod === "annual"
          ? `DODO_${plan.toUpperCase()}_ANNUAL_PRODUCT_ID`
          : `DODO_${plan.toUpperCase()}_PRODUCT_ID`;
      console.error(
        `Missing env var: ${missingVar} for plan "${plan}" (${billingPeriod})`,
      );
      return NextResponse.json(
        {
          error: `Product configuration missing for ${plan} (${billingPeriod}). Contact support.`,
        },
        { status: 500 },
      );
    }

    const dodo = getDodo();

    // Fetch org to reuse/create Dodo customer
    const { data: org } = await (supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", org_id)
      .single() as any);

    let dodoCustomerId = org?.stripe_customer_id || null;
    let needsNewCustomer = !dodoCustomerId;

    if (dodoCustomerId) {
      try {
        await dodo.customers.retrieve(dodoCustomerId);
      } catch {
        needsNewCustomer = true;
      }
    }

    if (needsNewCustomer) {
      const { data: orgInfo } = await (supabase
        .from("organizations")
        .select("name")
        .eq("id", org_id)
        .single() as any);

      const customer = await dodo.customers.create({
        email: user.email!,
        name: orgInfo?.name || org_id,
      });
      dodoCustomerId = customer.customer_id;

      // Store Dodo customer ID in the stripe_customer_id column
      await (supabase
        .from("organizations")
        .update({ stripe_customer_id: dodoCustomerId } as never)
        .eq("id", org_id) as any);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const payment = await dodo.subscriptions.create({
      product_id: productId!,
      customer: { customer_id: dodoCustomerId },
      payment_link: true,
      return_url: `${appUrl}/dashboard/billing?success=true`,
      billing: {
        city: "N/A",
        country: "US",
        state: "N/A",
        street: "N/A",
      },
      quantity: 1,
      metadata: {
        userId: user.id,
        orgId: org_id,
        plan,
        billingPeriod,
      },
    });

    return NextResponse.json({ url: payment.payment_link });
  } catch (err: any) {
    console.error("Checkout error:", err);
    const message = err?.message || err?.error?.message || "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
