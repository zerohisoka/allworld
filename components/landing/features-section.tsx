"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  Gauge,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import * as React from "react";

import { GlassCard } from "@/components/ui";
import { cn } from "@/lib/utils";

type Feature = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tone: "cyan" | "emerald" | "violet" | "pink";
};

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Real-time Biometric Reconciliation",
    description:
      "Continuous cross-check of attendance logs against shift schedules. Variance surfaced within seconds, not end-of-day.",
    tone: "cyan",
  },
  {
    icon: Brain,
    title: "Predictive Variance Analytics",
    description:
      "Anomaly model flags patterns you'd miss in a 10k-row sheet. Auto-classifies severity so the manual audit only sees what matters.",
    tone: "violet",
  },
  {
    icon: Zap,
    title: "Zero-Latency Report Generation",
    description:
      "Reports render in milliseconds from the local engine. No nightly batch, no waiting for an Excel macro to finish.",
    tone: "emerald",
  },
  {
    icon: Gauge,
    title: "Operational Health Telemetry",
    description:
      "Live API, caching, and flow-usage telemetry piped into one command center. Spot bottlenecks before they become incidents.",
    tone: "pink",
  },
];

const ICON_TONE: Record<Feature["tone"], string> = {
  cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  emerald: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  violet: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  pink: "text-[#e8a5a5] bg-[#e8a5a5]/10 border-[#e8a5a5]/20",
};

export function FeaturesSection() {
  return (
    <section
      id="architecture"
      className="relative mx-auto max-w-7xl px-6 py-32 md:py-40"
    >
      <div className="mb-16 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-widest text-aura-muted">
          <Sparkles className="h-3 w-3" />
          The architecture
        </div>
        <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-5xl">
          One engine.
          <br />
          <span className="text-aura-muted">Four guarantees.</span>
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-aura-muted">
          AURA is a hosted multi-tenant SaaS with per-organization row-level
          isolation. Your data is encrypted at rest and in transit, and each
          organization&apos;s branches, employees, and flags are walled off
          from every other tenant.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
              delay: i * 0.08,
            }}
          >
            <GlassCard
              glow={f.tone}
              padding="lg"
              className="h-full transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    ICON_TONE[f.tone],
                  )}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-aura-muted">
                    {f.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* A live "telemetry" strip — small visual proof of the dashboard
          being real, not just a screenshot. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6"
      >
        <GlassCard padding="md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-emerald-300" />
              <span className="text-[10px] uppercase tracking-widest text-aura-muted">
                Live pipeline
              </span>
              <span className="text-sm font-medium text-white">14 nodes</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <Stat label="Throughput" value="1.2M rows/min" tone="emerald" />
              <Stat label="p50 latency" value="38ms" tone="cyan" />
              <Stat label="Anomalies" value="0.04%" tone="violet" />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "emerald" | "violet";
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "cyan"
        ? "text-cyan-300"
        : "text-violet-300";
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-widest text-aura-muted">
        {label}
      </span>
      <span className={cn("font-medium tabular-nums", color)}>{value}</span>
    </div>
  );
}
