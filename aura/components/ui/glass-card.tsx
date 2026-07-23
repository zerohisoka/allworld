"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * GlassCard — the dark smoked-glass surface used everywhere in the app.
 *
 * If a `glow` variant is set, a soft colored halo is rendered behind the
 * card via a `::before` pseudo-element so it doesn't shift layout.
 */
const glassCardStyles = cva(
  "relative rounded-2xl border border-white/[0.06] bg-[#0a0a0f]/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.03)]",
  {
    variants: {
      glow: {
        none: "",
        cyan: [
          "before:pointer-events-none before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-cyan-400/10 before:to-transparent before:opacity-100 before:blur-sm",
          "hover:border-cyan-400/20",
        ],
        purple: [
          "before:pointer-events-none before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-violet-400/10 before:to-transparent before:opacity-100 before:blur-sm",
          "hover:border-violet-400/20",
        ],
        green: [
          "before:pointer-events-none before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-emerald-400/10 before:to-transparent before:opacity-100 before:blur-sm",
          "hover:border-emerald-400/20",
        ],
        emerald: [
          "before:pointer-events-none before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-emerald-400/10 before:to-transparent before:opacity-100 before:blur-sm",
          "hover:border-emerald-400/20",
        ],
        violet: [
          "before:pointer-events-none before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-violet-400/10 before:to-transparent before:opacity-100 before:blur-sm",
          "hover:border-violet-400/20",
        ],
        pink: [
          "before:pointer-events-none before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-[#e8a5a5]/10 before:to-transparent before:opacity-100 before:blur-sm",
          "hover:border-[#e8a5a5]/20",
        ],
      },
      padding: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        none: "p-0",
      },
    },
    defaultVariants: {
      glow: "none",
      padding: "md",
    },
  },
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardStyles> {}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard({ className, glow, padding, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(glassCardStyles({ glow, padding }), className)}
        {...props}
      />
    );
  },
);
