"use client";

import { motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  X,
} from "lucide-react";
import * as React from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const BASE_NAV: Omit<NavItem, "badge">[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Branches", href: "/dashboard/branches", icon: Users },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  userName?: string;
  userRole?: string;
  userInitials?: string;
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
  userName = "User",
  userRole = "",
  userInitials = "AU",
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [reportCount, setReportCount] = React.useState<string | undefined>();
  const [alertCount, setAlertCount] = React.useState<string | undefined>();
  const pathname = usePathname();
  const open = mobileOpen;

  // Fetch real badge counts
  React.useEffect(() => {
    async function loadCounts() {
      try {
        const [reportsRes, alertsRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/alerts"),
        ]);
        const reportsData = await reportsRes.json();
        const alertsData = await alertsRes.json();

        const reports = reportsData.reports || [];
        const readyReports = reports.filter((r: any) => r.status === "ready");
        if (readyReports.length > 0) {
          setReportCount(String(readyReports.length));
        }

        if (alertsData.firing_count > 0) {
          setAlertCount(String(alertsData.firing_count));
        }
      } catch {
        // Keep defaults (no badge shown)
      }
    }
    loadCounts();
  }, []);

  const NAV: NavItem[] = BASE_NAV.map((item) => {
    if (item.label === "Reports") return { ...item, badge: reportCount };
    if (item.label === "Alerts") return { ...item, badge: alertCount };
    return item;
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onMobileClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/[0.06] bg-[#07070b]/80 backdrop-blur-xl transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed && "md:w-[72px]",
        )}
      >
        {/* Brand + collapse */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-white/[0.04] px-4",
            collapsed && "md:justify-center md:px-0",
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </span>
            {!collapsed && (
              <span className="text-sm font-semibold tracking-[0.2em] text-white">
                AURA
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close menu"
              className="rounded-md p-1.5 text-aura-muted hover:bg-white/[0.04] hover:text-white md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Toggle sidebar"
              className="hidden rounded-md p-1.5 text-aura-muted hover:bg-white/[0.04] hover:text-white md:inline-flex"
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  collapsed && "rotate-180",
                )}
              />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div
            className={cn(
              "mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-aura-muted",
              collapsed && "md:hidden",
            )}
          >
            Workspace
          </div>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-white/[0.04] text-white"
                        : "text-white/60 hover:bg-white/[0.02] hover:text-white",
                      collapsed && "md:justify-center md:px-0",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-white" />
                    )}
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-white" : "text-aura-muted",
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge ? (
                          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-white/70">
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer — user card */}
        <div
          className={cn(
            "border-t border-white/[0.04] p-3",
            collapsed && "md:p-2",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5",
              collapsed && "md:justify-center md:px-0",
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-400/30 text-xs font-semibold text-white">
              {userInitials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-white">
                  {userName}
                </div>
                {userRole && (
                  <div className="truncate text-[10px] text-aura-muted">
                    {userRole}
                  </div>
                )}
              </div>
            )}
            {!collapsed && (
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(126,231,135,0.8)]" />
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
