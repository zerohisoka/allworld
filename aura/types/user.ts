export type SubscriptionTier = "free" | "starter" | "growth" | "enterprise";

export interface PlanLimits {
  branches: number | "unlimited";
  seats: number | "unlimited";
  imports: "manual" | "scheduled";
  historyDays: number | "unlimited";
  alertRules: number | "unlimited";
  apiAccess: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  annualPrice: number;
  dodoProductId: string | null;
  dodoAnnualProductId: string | null;
  limits: PlanLimits;
  features: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface OrgMembership {
  id: string;
  org_id: string;
  org_name: string;
  role: "admin" | "executive" | "branch_manager";
}
