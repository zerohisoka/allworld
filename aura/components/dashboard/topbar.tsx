"use client";

import { motion } from "framer-motion";
import { Bell, LogOut, Menu, Search, Settings } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface TopbarProps {
  onOpenMobileNav?: () => void;
  userEmail?: string | null;
  userInitials?: string;
}

export function Topbar({
  onOpenMobileNav,
  userEmail,
  userInitials = "AU",
}: TopbarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on click outside
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-white/[0.04] bg-[#050507]/70 px-3 backdrop-blur-xl md:gap-3 md:px-6"
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/80 transition-colors hover:border-white/20 hover:text-white md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Search */}
      <div className="relative min-w-0 flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-aura-muted" />
        <input
          type="search"
          placeholder="Search branches, reports..."
          className={cn(
            "h-9 w-full rounded-md border border-white/[0.06] bg-white/[0.02] pl-9 pr-3 text-sm text-white placeholder:text-aura-muted",
            "outline-none transition-colors focus:border-white/[0.16] focus:bg-white/[0.04]",
          )}
        />
        <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-aura-muted md:inline-block">
          ⌘ K
        </kbd>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Live status pill */}
        <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 md:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] uppercase tracking-widest text-aura-muted">
            Live
          </span>
        </div>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] text-white/70 transition-colors hover:border-white/[0.16] hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-aura-pink shadow-[0_0_6px_rgba(232,165,165,0.8)]" />
        </button>

        {/* User avatar with dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/40 to-violet-400/40 text-xs font-semibold text-white ring-1 ring-white/10 transition-colors hover:from-cyan-400/50 hover:to-violet-400/50"
          >
            {userInitials}
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#0a0a0f]/95 p-1.5 shadow-2xl backdrop-blur-xl"
            >
              <div className="border-b border-white/[0.04] px-2.5 pb-2 pt-1.5">
                <p className="truncate text-sm font-medium text-white">
                  {userInitials}
                </p>
                {userEmail && (
                  <p className="truncate text-[10px] text-aura-muted">
                    {userEmail}
                  </p>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                <a
                  href="/settings"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </a>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-aura-pink transition-colors hover:bg-white/[0.04]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
