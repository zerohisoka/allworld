"use client";

import { motion } from "framer-motion";
import { ArrowRight, Fingerprint } from "lucide-react";
import * as React from "react";

import { CrystalCore } from "@/components/crystal-core";
import { NavButton } from "@/components/ui";
import { cn } from "@/lib/utils";

import {
  Activity,
  AlertTriangle,
  FloatingLeftCard,
  FloatingRightCard,
  FloatingStat,
  TrendingUp,
} from "./floating-dashboard-card";

/* Stagger helper for the centered text + CTA reveal. */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      delay: 0.2 + i * 0.12,
    },
  }),
};

const floatLeft = {
  hidden: { opacity: 0, x: -60, y: 20 },
  show: {
    opacity: 0.45,
    x: 0,
    y: 0,
    transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const, delay: 0.6 },
  },
};

const floatRight = {
  hidden: { opacity: 0, x: 60, y: -20 },
  show: {
    opacity: 0.45,
    x: 0,
    y: 0,
    transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const, delay: 0.7 },
  },
};

export function HeroSection() {
  return (
    <section
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden pt-16",
      )}
    >
      {/* Crystal centerpiece — sits behind the text, slightly larger */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[640px] lg:h-[640px]"
        >
          <CrystalCore />
        </motion.div>
      </div>

      {/* Floating dashboard cards (depth — blurred, behind the text) */}
      <motion.div
        variants={floatLeft}
        initial="hidden"
        animate="show"
        className="pointer-events-none absolute left-[3%] top-[18%] hidden origin-top-left scale-[0.62] blur-[1.5px] md:block"
        style={{ opacity: 0.45 }}
      >
        <FloatingLeftCard />
      </motion.div>
      <motion.div
        variants={floatRight}
        initial="hidden"
        animate="show"
        className="pointer-events-none absolute right-[3%] top-[12%] hidden origin-top-right scale-[0.62] blur-[1.5px] md:block"
        style={{ opacity: 0.45 }}
      >
        <FloatingRightCard />
      </motion.div>

      {/* Centered text + CTAs */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.h1
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Automated MIS Intelligence
          <span className="text-aura-pink">.</span>
          <br />
          Zero Spreadsheet Fatigue
          <span className="text-aura-pink">.</span>
        </motion.h1>

        <motion.p
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-aura-muted"
        >
          We do 90% of the heavy lifting. Our local engine instantly handles
          all messy data, aggregation, and variance reporting, while you focus
          on the final 1:1 cross-check manual audit.
        </motion.p>

        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <NavButton
            variant="primary"
            size="lg"
            className="shadow-[0_0_40px_-10px_rgba(255,255,255,0.25)]"
          >
            <Fingerprint className="h-4 w-4" />
            Initialize Live Demo
          </NavButton>
          <a
            href="#architecture"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Learn the Architecture
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        {/* Floating status chips — depth cues below the CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-12 flex flex-wrap items-center justify-center gap-2"
        >
          <FloatingStat
            icon={Activity}
            label="Realtime"
            value="98.4%"
            tone="emerald"
          />
          <FloatingStat
            icon={TrendingUp}
            label="Variance Δ"
            value="-12.6%"
            tone="cyan"
          />
          <FloatingStat
            icon={AlertTriangle}
            label="Flagged"
            value="14"
            tone="violet"
          />
        </motion.div>
      </div>
    </section>
  );
}
