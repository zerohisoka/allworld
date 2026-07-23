"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { AuditPipelineCard } from "@/components/dashboard/audit-pipeline-card";
import { CrystalHubCard } from "@/components/dashboard/crystal-hub-card";
import { OperationalOverviewCard } from "@/components/dashboard/operational-overview-card";
import { KPIChartCard } from "@/components/dashboard/kpi-chart-card";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, OrgMembership } from "@/types/user";

/* Page-load stagger */
const pageContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function DashboardPage() {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [orgs, setOrgs] = React.useState<OrgMembership[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState({
    flagged_discrepancies: 0,
    auto_resolved_percent: 0,
    total_nodes: 0,
  });

  // Close the drawer when the viewport grows past the md breakpoint
  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fetch user profile, org memberships, and dashboard summary
  React.useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const profile: UserProfile = {
            id: authUser.id,
            email: authUser.email ?? "",
            full_name: authUser.user_metadata?.full_name || null,
            avatar_url: authUser.user_metadata?.avatar_url || null,
          };
          setUser(profile);

          // Fetch org memberships
          const { data: memberships } = await supabase
            .from("org_members")
            .select("id, org_id, role, organizations(name)")
            .eq("user_id", authUser.id);

          if (memberships) {
            const mappedOrgs: OrgMembership[] = memberships.map((m) => {
              const org = m.organizations as unknown as { name: string };
              return {
                id: m.id,
                org_id: m.org_id,
                org_name: org?.name || "",
                role: m.role as "admin" | "executive" | "branch_manager",
              };
            });
            setOrgs(mappedOrgs);
          }

          // Fetch dashboard summary
          const res = await fetch("/api/dashboard/data");
          if (res.ok) {
            const data = await res.json();
            if (data.summary) {
              setSummary(data.summary);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const userName = user?.full_name || user?.email?.split("@")[0] || "User";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AU";
  const userRole =
    orgs.length > 0
      ? `${orgs[0].role.charAt(0).toUpperCase() + orgs[0].role.slice(1)} · ${orgs[0].org_name}`
      : "";
  const currentOrg = orgs[0]?.org_name || "";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        userName={userName}
        userRole={userRole}
        userInitials={userInitials}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          userEmail={user?.email}
          userInitials={userInitials}
        />
        <motion.main
          variants={pageContainer}
          initial="hidden"
          animate="show"
          className="flex-1 px-4 py-6 md:px-6 md:py-8"
        >
          {/* Page header */}
          <motion.div variants={item} className="mb-6 flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-widest text-aura-muted">
              {today} · Live{currentOrg ? ` · ${currentOrg}` : ""}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {getGreeting()}, {userName.split(" ")[0]}
              <span className="text-aura-pink">.</span>
            </h1>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-48 animate-pulse rounded bg-white/[0.06]" />
                <span className="text-aura-dim">·</span>
                <div className="h-3.5 w-36 animate-pulse rounded bg-white/[0.06]" />
                <span className="text-aura-dim">·</span>
                <div className="h-3.5 w-32 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ) : (
              <p className="text-sm text-aura-muted">
                {summary.flagged_discrepancies} flagged discrepancies · {summary.auto_resolved_percent}% auto-resolved · {summary.total_nodes} nodes online
              </p>
            )}
          </motion.div>

          {/* Row 1 — 2 columns on tablet, 3 on desktop, stacks on mobile */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <motion.div variants={item}>
              <AuditPipelineCard />
            </motion.div>
            <motion.div variants={item}>
              <CrystalHubCard />
            </motion.div>
            <motion.div variants={item}>
              <OperationalOverviewCard />
            </motion.div>
          </div>

          {/* Row 2 — full width KPI chart */}
          <motion.div variants={item} className="mt-4">
            <KPIChartCard />
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}
