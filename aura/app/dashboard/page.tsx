"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { AuditPipelineCard } from "@/components/dashboard/audit-pipeline-card";
import { CrystalHubCard } from "@/components/dashboard/crystal-hub-card";
import { OperationalOverviewCard } from "@/components/dashboard/operational-overview-card";
import { KPIChartCard } from "@/components/dashboard/kpi-chart-card";

/* Page-load stagger — fade up, 90ms between siblings. */
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
  // Mobile drawer state is owned by the page so the topbar hamburger
  // and the sidebar drawer stay in sync.
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Close the drawer when the viewport grows past the md breakpoint,
  // so opening-then-resizing doesn't leave a stale overlay.
  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <motion.main
          variants={pageContainer}
          initial="hidden"
          animate="show"
          className="flex-1 px-4 py-6 md:px-6 md:py-8"
        >
          {/* Page header */}
          <motion.div variants={item} className="mb-6 flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-widest text-aura-muted">
              Friday, July 18 · Live
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Good evening, Nikhil
              <span className="text-aura-pink">.</span>
            </h1>
            <p className="text-sm text-aura-muted">
              14 flagged discrepancies · 92% auto-resolved · 7 nodes online
            </p>
          </motion.div>

          {/* Row 1 — 3 columns on desktop, stacks on mobile */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
