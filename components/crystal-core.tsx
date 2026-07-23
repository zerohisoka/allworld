"use client";

/**
 * CrystalCore — the brand centerpiece.
 *
 * A faceted, translucent crystal with internal refractions, three orbital
 * rings, and a constellation of glowing data nodes connected by thin
 * SVG arcs. The whole thing floats gently via Framer Motion.
 *
 * Sized via the `size` prop so it can be used both as the hero element
 * (large) and as a smaller dashboard "hub" element.
 */

import { motion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

type CrystalCoreProps = {
  /** Total width/height in pixels. */
  size?: number;
  /** When true, draws connecting lines and node labels (for the dashboard hub). */
  showNetwork?: boolean;
  /** Extra class for the outer wrapper. */
  className?: string;
};

/* --------------------------------------------------------------------------
   Geometry helpers
   -------------------------------------------------------------------------- */

/**
 * Pre-compute node positions around a unit circle. We use these to place
 * the data nodes and to draw connecting SVG arcs through the crystal.
 */
const NODES = Array.from({ length: 8 }).map((_, i) => {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
  return {
    angle,
    x: Math.cos(angle),
    y: Math.sin(angle),
    color: i % 3 === 0 ? "cyan" : i % 3 === 1 ? "emerald" : "violet",
    delay: i * 0.18,
  };
});

/* --------------------------------------------------------------------------
   Component
   -------------------------------------------------------------------------- */

export function CrystalCore({
  size,
  showNetwork = false,
  className,
}: CrystalCoreProps) {
  // If `size` is given, it acts as an explicit pixel size (overrides any
  // className-based sizing). If omitted, the parent must size the wrapper
  // via className (e.g. `w-[280px] h-[280px] md:w-[500px] md:h-[500px]`)
  // — this is what enables responsive sizing on the hero.
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative",
        size === undefined && "aspect-square w-full max-w-[640px]",
        className,
      )}
      style={{
        width: size,
        height: size,
        perspective: 1200,
      }}
    >
      {/* Atmospheric outer glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(120,200,255,0.10) 0%, rgba(167,139,250,0.05) 35%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Slow outer halo ring */}
      <div
        className="pointer-events-none absolute inset-[6%] rounded-full"
        style={{
          boxShadow: "0 0 120px -20px rgba(120,200,255,0.18)",
        }}
      />

      {/* The floating crystal — wrapped so we can float the whole group */}
      <motion.div
        className="absolute inset-0"
        animate={{ y: [0, -14, 0], rotate: [0, 2, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ----------------------------------------------------------------
            ORBITAL RINGS
            Three rings rotated on different 3D axes, each animated.
            ---------------------------------------------------------------- */}
        <div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute inset-[8%] rounded-full"
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                transformStyle: "preserve-3d",
                animation: `crystal-orbit-${i} ${18 + i * 6}s linear infinite`,
                boxShadow:
                  i === 0
                    ? "0 0 30px -10px rgba(103,232,249,0.25)"
                    : i === 1
                      ? "0 0 30px -10px rgba(126,231,135,0.20)"
                      : "0 0 30px -10px rgba(167,139,250,0.20)",
              }}
            />
          ))}
        </div>

        {/* ----------------------------------------------------------------
            CRYSTAL BODY
            A faceted shape built from layered rotated squares with
            internal gradients to suggest refraction.
            ---------------------------------------------------------------- */}
        <div
          className="absolute"
          style={{
            inset: "18%",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Main diamond — outer faceted shell */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(120,200,255,0.10) 0%, rgba(167,139,250,0.10) 50%, rgba(126,231,135,0.08) 100%)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              transform: "rotateX(58deg) rotateZ(45deg)",
              boxShadow:
                "inset 0 0 60px rgba(120,200,255,0.08), inset 0 0 120px rgba(167,139,250,0.06), 0 0 80px -20px rgba(120,200,255,0.30)",
            }}
          />

          {/* Inner facet — slightly smaller, different rotation for depth */}
          <div
            className="absolute inset-[12%]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(103,232,249,0.08) 50%, rgba(167,139,250,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              transform: "rotateX(58deg) rotateZ(45deg) rotate(15deg)",
              boxShadow:
                "inset 0 0 30px rgba(126,231,135,0.10), inset 0 0 60px rgba(120,200,255,0.06)",
            }}
          />

          {/* Core highlight — a small bright square that gives a "lit interior" feel */}
          <div
            className="absolute"
            style={{
              inset: "32%",
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45) 0%, rgba(180,220,255,0.15) 30%, transparent 65%)",
              transform: "rotateX(58deg) rotateZ(45deg)",
              filter: "blur(2px)",
            }}
          />

          {/* Subtle internal reflection — a thin diagonal line of light */}
          <div
            className="absolute"
            style={{
              top: "20%",
              left: "30%",
              right: "30%",
              bottom: "20%",
              transform: "rotateX(58deg) rotateZ(45deg) rotate(45deg)",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
              filter: "blur(3px)",
            }}
          />
        </div>

        {/* ----------------------------------------------------------------
            CONSTELLATION NODES
            Small glowing dots placed around the crystal. Each pulses and
            emits a colored glow that matches its type.
            ---------------------------------------------------------------- */}
        <div className="absolute inset-0">
          {NODES.map((node, i) => {
            const radius = 44; // % of half-size — place just outside the crystal
            const x = 50 + Math.cos(node.angle) * radius;
            const y = 50 + Math.sin(node.angle) * radius;
            const colorVar =
              node.color === "cyan"
                ? "103,232,249"
                : node.color === "emerald"
                  ? "126,231,135"
                  : "167,139,250";
            return (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: 5,
                  height: 5,
                  transform: "translate(-50%, -50%)",
                  background: `rgba(${colorVar}, 1)`,
                  boxShadow: `0 0 12px rgba(${colorVar}, 0.9), 0 0 22px rgba(${colorVar}, 0.5)`,
                  animation: `crystal-pulse 2.6s ease-in-out ${node.delay}s infinite`,
                }}
              />
            );
          })}
        </div>

        {/* ----------------------------------------------------------------
            ORBITAL ARCS
            Thin curved SVG paths connecting a few of the nodes through
            the crystal interior. Gives the "neural network" feeling.
            ---------------------------------------------------------------- */}
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 100 100"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="arc-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(103,232,249,0)" />
              <stop offset="50%" stopColor="rgba(103,232,249,0.55)" />
              <stop offset="100%" stopColor="rgba(103,232,249,0)" />
            </linearGradient>
            <linearGradient id="arc-violet" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(167,139,250,0)" />
              <stop offset="50%" stopColor="rgba(167,139,250,0.55)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0)" />
            </linearGradient>
            <linearGradient id="arc-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(126,231,135,0)" />
              <stop offset="50%" stopColor="rgba(126,231,135,0.55)" />
              <stop offset="100%" stopColor="rgba(126,231,135,0)" />
            </linearGradient>
          </defs>
          {/* Curved arcs between non-adjacent nodes */}
          <path
            d="M 50 6 Q 78 30 70 70"
            fill="none"
            stroke="url(#arc-cyan)"
            strokeWidth="0.18"
          />
          <path
            d="M 94 50 Q 70 78 30 70"
            fill="none"
            stroke="url(#arc-emerald)"
            strokeWidth="0.18"
          />
          <path
            d="M 50 94 Q 22 70 30 30"
            fill="none"
            stroke="url(#arc-violet)"
            strokeWidth="0.18"
          />
          <path
            d="M 6 50 Q 30 22 70 30"
            fill="none"
            stroke="url(#arc-cyan)"
            strokeWidth="0.18"
          />
        </svg>
      </motion.div>

      {/* Optional network hub labels — used in the dashboard center column */}
      {showNetwork && (
        <div className="pointer-events-none absolute inset-0">
          {[
            { label: "Noida Branch", x: 92, y: 22, color: "emerald" },
            { label: "Logistics", x: 96, y: 52, color: "cyan" },
            { label: "Finance", x: 88, y: 78, color: "violet" },
          ].map((hub) => (
            <div
              key={hub.label}
              className="absolute -translate-y-1/2"
              style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background:
                      hub.color === "emerald"
                        ? "rgb(126,231,135)"
                        : hub.color === "cyan"
                          ? "rgb(103,232,249)"
                          : "rgb(167,139,250)",
                    boxShadow:
                      hub.color === "emerald"
                        ? "0 0 8px rgb(126,231,135)"
                        : hub.color === "cyan"
                          ? "0 0 8px rgb(103,232,249)"
                          : "0 0 8px rgb(167,139,250)",
                  }}
                />
                <span className="text-[10px] uppercase tracking-widest text-aura-muted">
                  {hub.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </motion.div>
  );
}

export default CrystalCore;
