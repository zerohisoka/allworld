"use client";

import { Key } from "lucide-react";
import * as React from "react";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.04] bg-black/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-aura-muted md:flex-row">
        <div className="flex items-center gap-2">
          <Key className="h-3.5 w-3.5" />
          <span className="tracking-[0.2em] text-white">AURA</span>
          <span className="ml-2">
            © {new Date().getFullYear()} — Automated MIS Intelligence
          </span>
        </div>
        <nav className="flex items-center gap-5">
          <a href="#privacy" className="transition-colors hover:text-white">
            Privacy
          </a>
          <a href="#terms" className="transition-colors hover:text-white">
            Terms
          </a>
          <a href="#status" className="transition-colors hover:text-white">
            Status
          </a>
          <a href="#contact" className="transition-colors hover:text-white">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
