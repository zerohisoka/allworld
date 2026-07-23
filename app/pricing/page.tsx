"use client";

import { motion } from "framer-motion";
import { Check, Key, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { GlassCard } from "@/components/ui";
import { PLANS, type PlanId } from "@/lib/dodo/plans";

type BillingPeriod = "monthly" | "annual";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = React.useState<BillingPeriod>("monthly");
  const router = useRouter();

  const paidTiers: PlanId[] = ["starter", "growth", "enterprise"];

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/[0.04] bg-black/20 backdrop-blur-md">
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-aura-pink">
              <Key className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-semibold tracking-[0.2em] text-white">
              AURA
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              Get started
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-aura-muted">
            Choose the plan that fits your team size and monitoring needs.
            All plans include a 14-day free trial.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-white text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                billingPeriod === "annual"
                  ? "bg-white text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Annual{" "}
              <span className="ml-1 text-[10px] uppercase tracking-wider text-emerald-400">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards — stack on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paidTiers.map((tierId, i) => {
            const tier = PLANS[tierId];
            const price =
              billingPeriod === "annual" ? tier.annualPrice : tier.price;
            const displayPrice = price === 0 ? "Free" : `$${price}`;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.1,
                }}
              >
                <GlassCard
                  glow={tierId === "enterprise" ? "pink" : "none"}
                  padding="lg"
                  className={`flex h-full flex-col ${
                    tierId === "growth"
                      ? "border-white/[0.12]"
                      : ""
                  }`}
                >
                  {/* Tier name + price */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      {tier.name}
                    </h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-light tracking-tighter text-white tabular-nums">
                        {displayPrice}
                      </span>
                      {price > 0 && (
                        <span className="text-sm text-aura-muted">
                          /{billingPeriod === "annual" ? "year" : "month"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => {
                      const signupUrl = `/signup?plan=${tier.id}`;
                      router.push(signupUrl);
                    }}
                    className={`mb-8 w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      tierId === "enterprise"
                        ? "bg-white text-black hover:bg-white/90"
                        : "border border-white/20 text-white hover:border-white/40 hover:bg-white/[0.04]"
                    }`}
                  >
                    {tierId === "starter"
                      ? "Start free trial"
                      : "Get started"}
                  </button>

                  {/* Features */}
                  <div className="flex-1 space-y-3">
                    <div className="border-b border-white/[0.04] pb-2 text-[10px] uppercase tracking-widest text-aura-muted">
                      Includes
                    </div>
                    {tier.features.map((feature, fi) => (
                      <div
                        key={fi}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span className="text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 text-center text-xs text-aura-muted">
        <p>
          All plans include a 14-day free trial. No credit card required for
          trial. Prices in USD.
        </p>
      </footer>
    </div>
  );
}
