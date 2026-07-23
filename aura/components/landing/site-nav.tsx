"use client";

import { Key, Download, ArrowUpRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Site-wide fixed navbar.
 * Backdrop-blurred, hairline border, brand on the left, login + CTA on the right.
 */
export function SiteNav({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-16 border-b border-white/[0.04] bg-black/20 backdrop-blur-md",
        className,
      )}
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Brand */}
        <a
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="AURA home"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-aura-text transition-colors group-hover:border-white/20">
            <Key className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold tracking-[0.2em] text-white">
            AURA
          </span>
        </a>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          <a
            href="#login"
            className="hidden text-sm text-white/70 transition-colors hover:text-white sm:inline-block"
          >
            Log in
          </a>
          <a
            href="#download"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-sm text-white transition-colors hover:border-white/40 hover:bg-white/[0.04]"
          >
            Download
            <Download className="h-3.5 w-3.5" />
          </a>
          <a
            href="/dashboard"
            className="hidden items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white/90 sm:inline-flex"
          >
            Launch app
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </nav>
    </header>
  );
}
