import type { PlanLimits, Plan } from "@/types/user";

/**
 * AURA pricing tiers — 3 tiers matching the WCAG Scanner price anchors
 * ($29 / $89 / $175) but with attendance‑specific quota dimensions.
 *
 * Dodo product IDs come from env vars — they MUST exist in the Dodo
 * dashboard before deploy. Do not fabricate placeholder IDs.
 */
export type PaidTier = "starter" | "growth" | "enterprise";

export const PLANS: Record<string, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    annualPrice: 0,
    dodoProductId: null,
    dodoAnnualProductId: null,
    limits: {
      branches: 1,
      seats: 1,
      imports: "manual",
      historyDays: 7,
      alertRules: 1,
      apiAccess: false,
    },
    features: [
      "1 branch monitored",
      "1 team seat",
      "Manual CSV upload",
      "7-day report history",
      "1 alert rule",
    ],
  },

  starter: {
    id: "starter",
    name: "Starter",
    price: 29,
    annualPrice: 290,
    dodoProductId: process.env.DODO_STARTER_PRODUCT_ID!,
    dodoAnnualProductId: process.env.DODO_STARTER_ANNUAL_PRODUCT_ID!,
    limits: {
      branches: 5,
      seats: 3,
      imports: "manual",
      historyDays: 30,
      alertRules: 3,
      apiAccess: false,
    },
    features: [
      "5 branches monitored",
      "3 team seats",
      "Manual CSV upload",
      "30-day report history",
      "3 alert rules",
    ],
  },

  growth: {
    id: "growth",
    name: "Growth",
    price: 89,
    annualPrice: 890,
    dodoProductId: process.env.DODO_GROWTH_PRODUCT_ID!,
    dodoAnnualProductId: process.env.DODO_GROWTH_ANNUAL_PRODUCT_ID!,
    limits: {
      branches: 15,
      seats: 10,
      imports: "manual",
      historyDays: 365,
      alertRules: 15,
      apiAccess: false,
    },
    features: [
      "15 branches monitored",
      "10 team seats",
      "Manual CSV upload",
      "12-month report history",
      "15 alert rules",
    ],
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 175,
    annualPrice: 1750,
    dodoProductId: process.env.DODO_ENTERPRISE_PRODUCT_ID!,
    dodoAnnualProductId: process.env.DODO_ENTERPRISE_ANNUAL_PRODUCT_ID!,
    limits: {
      branches: 25,
      seats: "unlimited",
      imports: "scheduled",
      historyDays: "unlimited",
      alertRules: "unlimited",
      apiAccess: true,
    },
    features: [
      "25 branches monitored",
      "Unlimited team seats",
      "Manual CSV upload + scheduled auto-import",
      "Unlimited report history",
      "Unlimited alert rules",
      "Exclusive API / integration access",
    ],
  },
};

export type PlanId = keyof typeof PLANS;

export function getPlanLimits(planId: string): PlanLimits {
  return PLANS[planId as PlanId]?.limits ?? PLANS.free.limits;
}

export function isPaidTier(planId: string): planId is PaidTier {
  return (
    planId === "starter" || planId === "growth" || planId === "enterprise"
  );
}
