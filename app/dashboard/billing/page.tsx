"use client";

import { useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle, Calendar, ArrowUpRight } from "lucide-react";
import * as React from "react";

import { GlassCard, ProgressBar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { PLANS, getPlanLimits, type PlanId } from "@/lib/dodo/plans";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const success = searchParams?.get("success");

  const [org, setOrg] = React.useState<{
    id: string;
    name: string;
    plan_tier: string;
  } | null>(null);
  const [subscription, setSubscription] = React.useState<{
    plan: string;
    status: string;
    current_period_end: string | null;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch org + subscription
      const { data: memberships } = await (supabase
        .from("org_members")
        .select("org_id, organizations(*)")
        .eq("user_id", user.id)
        .single() as any);

      if (memberships) {
        const orgData = memberships.organizations as {
          id: string;
          name: string;
          plan_tier: string;
          stripe_customer_id: string | null;
        };
        setOrg({
          id: orgData.id,
          name: orgData.name,
          plan_tier: orgData.plan_tier,
        });

        const { data: sub } = await (supabase
          .from("subscriptions")
          .select("*")
          .eq("org_id", orgData.id)
          .single() as any);

        setSubscription(sub);
      }
    } catch (err) {
      console.error("Failed to load billing:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planId: string, period: string = "monthly") {
    if (!org) return;
    setActionLoading(planId);

    try {
      const res = await fetch("/api/dodo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          org_id: org.id,
          billingPeriod: period,
        }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const err = await res.json();
        alert(err.error || "Checkout failed");
      }
    } catch (err) {
      alert("Error starting checkout.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleManageSubscription() {
    if (!org) return;
    setActionLoading("manage");

    try {
      const res = await fetch("/api/dodo/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: org.id }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not open subscription portal");
      }
    } catch {
      alert("Error opening subscription portal.");
    } finally {
      setActionLoading(null);
    }
  }

  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "annual">("monthly");

  const currentTier = org?.plan_tier || "free";
  const planConfig = PLANS[currentTier] || PLANS.free;
  const limits = getPlanLimits(currentTier);
  const isPaid = currentTier !== "free";

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Billing
        </h1>
        <p className="mt-1 text-sm text-aura-muted">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Success banner */}
      {success === "true" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold text-emerald-300">
              Payment Successful!
            </p>
            <p className="text-sm text-aura-muted">
              Your plan has been upgraded. It may take a moment to reflect.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <GlassCard padding="md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Current Plan</h2>
          <span className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white capitalize">
            {currentTier}
          </span>
        </div>

        {renewalDate && (
          <div className="mb-4 flex items-center gap-2 text-sm text-aura-muted">
            <Calendar className="h-4 w-4" />
            <span>Renews on {renewalDate}</span>
          </div>
        )}

        {/* Limits grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LimitBox
            label="Branches"
            value={limits.branches === "unlimited" ? "∞" : String(limits.branches)}
          />
          <LimitBox
            label="Seats"
            value={limits.seats === "unlimited" ? "∞" : String(limits.seats)}
          />
          <LimitBox
            label="History"
            value={limits.historyDays === "unlimited" ? "∞" : `${limits.historyDays}d`}
          />
          <LimitBox
            label="Alert Rules"
            value={limits.alertRules === "unlimited" ? "∞" : String(limits.alertRules)}
          />
        </div>

        {/* Plan features */}
        <div className="mb-6">
          <h3 className="mb-3 text-[10px] uppercase tracking-widest text-aura-muted">
            Plan Features
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {planConfig.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Billing period toggle for upgrades */}
          {!isPaid && (
            <div className="mb-4 inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5 text-[11px]">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  billingPeriod === "monthly"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  billingPeriod === "annual"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Annual{" "}
                <span className="text-[10px] text-emerald-400">
                  Save 17%
                </span>
              </button>
            </div>
          )}

          {isPaid ? (
            <button
              onClick={handleManageSubscription}
              disabled={actionLoading === "manage"}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              {actionLoading === "manage" ? "Loading..." : "Manage Subscription"}
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {["starter", "growth", "enterprise"].map((planId) => (
                <button
                  key={planId}
                  onClick={() => handleUpgrade(planId, billingPeriod)}
                  disabled={actionLoading === planId}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {actionLoading === planId ? "Loading..." : `Upgrade to ${PLANS[planId].name}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function LimitBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-widest text-aura-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-light tracking-tighter text-white tabular-nums">
        {value}
      </p>
    </div>
  );
}
