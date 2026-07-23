import { createClient } from "@supabase/supabase-js";
import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const webhook = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
  const rawBody = await request.text();
  const headersList = await headers();

  const webhookHeaders = {
    "webhook-id": headersList.get("webhook-id") || "",
    "webhook-signature": headersList.get("webhook-signature") || "",
    "webhook-timestamp": headersList.get("webhook-timestamp") || "",
  };

  try {
    await webhook.verify(rawBody, webhookHeaders);
  } catch (err) {
    console.error("Dodo webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload.type || payload.event_type;
  const data = payload.data;

  // ── Active / Renewed — set plan, save customer/subscription IDs
  if (eventType === "subscription.active" || eventType === "subscription.renewed") {
    const orgId =
      data?.metadata?.orgId ||
      data?.subscription?.metadata?.orgId ||
      payload.metadata?.orgId;

    const plan =
      data?.metadata?.plan ||
      data?.subscription?.metadata?.plan ||
      payload.metadata?.plan;

    const customerId =
      data?.customer?.customer_id ||
      data?.customer_id ||
      data?.subscription?.customer?.customer_id;

    const subscriptionId =
      data?.subscription_id || payload.data?.subscription_id;

    if (!orgId) {
      console.error("No orgId in webhook metadata");
      return Response.json({ received: true });
    }

    // Update organization plan_tier
    const { error: orgError } = await supabase
      .from("organizations")
      .update({
        plan_tier: plan || "starter",
        stripe_customer_id: customerId,
      })
      .eq("id", orgId);

    if (orgError) {
      console.error("Failed to update organization:", orgError);
    }

    // Upsert subscription record
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("org_id", orgId)
      .single();

    if (existingSub) {
      await supabase
        .from("subscriptions")
        .update({
          plan: plan || "starter",
          status: "active",
          stripe_customer_id: customerId,
          subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSub.id);
    } else {
      await supabase.from("subscriptions").insert({
        org_id: orgId,
        plan: plan || "starter",
        status: "active",
        stripe_customer_id: customerId,
        subscription_id: subscriptionId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
    }

    console.log(`Updated org ${orgId} to plan ${plan}`);
  }

  // ── On Hold — payment failed, don't downgrade, give grace period
  if (eventType === "subscription.on_hold") {
    console.log("Subscription on hold — payment method needs updating");
  }

  // ── Cancelled / Expired / Failed — downgrade to free
  if (
    eventType === "subscription.cancelled" ||
    eventType === "subscription.expired" ||
    eventType === "subscription.failed"
  ) {
    const customerId =
      data?.customer?.customer_id;

    // Find org by customer ID and downgrade
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (org) {
      await supabase
        .from("organizations")
        .update({ plan_tier: "free" })
        .eq("id", org.id);

      await supabase
        .from("subscriptions")
        .update({
          status: eventType === "subscription.cancelled" ? "canceled" : "expired",
          plan: "free",
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", org.id);
    }
  }

  return Response.json({ received: true });
}
