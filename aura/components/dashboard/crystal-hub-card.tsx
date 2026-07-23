"use client";

import * as React from "react";

import { CrystalCore } from "@/components/crystal-core";
import { GlassCard } from "@/components/ui";
import { cn } from "@/lib/utils";

/* Pre-defined hub nodes — color matched to the design ref.
   On small screens we collapse down to 4 hubs (the 3 most spaced out per side)
   to keep the labels readable. */
const HUBS_DESKTOP = [
  { id: "noida-1", label: "Noida Branch", sub: "Node", x: 12, y: 22, color: "rgb(126,231,135)" },
  { id: "logistics-1", label: "Logistics", sub: "Node", x: 8, y: 50, color: "rgb(103,232,249)" },
  { id: "finance-1", label: "Finance", sub: "Node", x: 14, y: 78, color: "rgb(167,139,250)" },
  { id: "logistics-2", label: "Logistics", sub: "Node", x: 88, y: 28, color: "rgb(167,139,250)" },
  { id: "logistics-3", label: "Logistics", sub: "Node", x: 92, y: 56, color: "rgb(167,139,250)" },
  { id: "finance-2", label: "Finance", sub: "Node", x: 86, y: 80, color: "rgb(126,231,135)" },
  { id: "noida-2", label: "Noida Branch", sub: "Node", x: 88, y: 92, color: "rgb(126,231,135)" },
];

const HUBS_MOBILE = [
  { id: "noida-1", label: "Noida", sub: "Node", x: 10, y: 28, color: "rgb(126,231,135)" },
  { id: "logistics-1", label: "Logistics", sub: "Node", x: 6, y: 70, color: "rgb(103,232,249)" },
  { id: "logistics-2", label: "Logistics", sub: "Node", x: 90, y: 32, color: "rgb(167,139,250)" },
  { id: "finance-1", label: "Finance", sub: "Node", x: 94, y: 72, color: "rgb(126,231,135)" },
];

export function CrystalHubCard() {
  // SSR-safe default; the actual media query effect below swaps it on the client.
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const HUBS = isMobile ? HUBS_MOBILE : HUBS_DESKTOP;

  return (
    <GlassCard padding="md" className="relative flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white">
            Network Hub
          </h3>
          <p className="mt-1 text-[10px] text-aura-muted">
            Cross-branch reconciliation mesh
          </p>
        </div>
        <span className="text-[10px] text-aura-muted">⋯</span>
      </div>

      {/* Hub canvas — relative wrapper for the crystal + nodes + lines */}
      <div className="relative mx-auto mt-2 aspect-square w-full max-w-[420px] flex-1">
        {/* SVG connecting lines (drawn beneath everything else) */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="hub-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(126,231,135,0.5)" />
              <stop offset="100%" stopColor="rgba(103,232,249,0.5)" />
            </linearGradient>
            <linearGradient id="hub-line-2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(167,139,250,0.5)" />
              <stop offset="100%" stopColor="rgba(103,232,249,0.5)" />
            </linearGradient>
          </defs>
          {/* Left-side nodes to crystal center */}
          <path
            d={`M ${HUBS[0].x} ${HUBS[0].y} Q 35 50 50 50`}
            fill="none"
            stroke="url(#hub-line)"
            strokeWidth="0.2"
            strokeDasharray="0.6 0.6"
          />
          <path
            d={`M ${HUBS[1].x} ${HUBS[1].y} Q 30 50 50 50`}
            fill="none"
            stroke="url(#hub-line-2)"
            strokeWidth="0.2"
            strokeDasharray="0.6 0.6"
          />
          <path
            d={`M ${HUBS[2].x} ${HUBS[2].y} Q 35 65 50 50`}
            fill="none"
            stroke="url(#hub-line)"
            strokeWidth="0.2"
            strokeDasharray="0.6 0.6"
          />
          {/* Right-side nodes to crystal center */}
          <path
            d={`M ${HUBS[3].x} ${HUBS[3].y} Q 75 35 50 50`}
            fill="none"
            stroke="url(#hub-line-2)"
            strokeWidth="0.2"
            strokeDasharray="0.6 0.6"
          />
          <path
            d={`M ${HUBS[4].x} ${HUBS[4].y} Q 70 50 50 50`}
            fill="none"
            stroke="url(#hub-line-2)"
            strokeWidth="0.2"
            strokeDasharray="0.6 0.6"
          />
          <path
            d={`M ${HUBS[5].x} ${HUBS[5].y} Q 70 65 50 50`}
            fill="none"
            stroke="url(#hub-line)"
            strokeWidth="0.2"
            strokeDasharray="0.6 0.6"
          />
          <path
            d={`M ${HUBS[6].x} ${HUBS[6].y} Q 70 75 50 50`}
            fill="none"
            stroke="url(#hub-line)"
            strokeWidth="0.2"
            strokeDasharray="0.6 0.6"
          />
        </svg>

        {/* The crystal itself — absolute centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <CrystalCore size={300} showNetwork />
        </div>

        {/* Hub labels (positioned over the SVG) */}
        {HUBS.map((hub) => {
          // Anchor left labels to the right, right labels to the left
          const isLeft = hub.x < 50;
          return (
            <div
              key={hub.id}
              className={cn(
                "absolute -translate-y-1/2",
                isLeft ? "left-0" : "right-0",
              )}
              style={{ top: `${hub.y}%` }}
            >
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-[#0a0a0f]/80 px-2 py-1 backdrop-blur-sm",
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: hub.color,
                    boxShadow: `0 0 8px ${hub.color}`,
                  }}
                />
                <div>
                  <div className="text-[10px] font-medium leading-tight text-white">
                    {hub.label}
                  </div>
                  <div className="text-[8px] uppercase tracking-widest text-aura-muted">
                    {hub.sub}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer status row */}
      <div className="mt-2 flex items-center justify-between border-t border-white/[0.04] pt-3 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="uppercase tracking-widest text-aura-muted">
            Mesh online
          </span>
        </div>
        <div className="flex items-center gap-3 text-aura-muted">
          <span>
            <span className="text-white">7</span> nodes
          </span>
          <span>
            <span className="text-emerald-300">99.97%</span> uptime
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
