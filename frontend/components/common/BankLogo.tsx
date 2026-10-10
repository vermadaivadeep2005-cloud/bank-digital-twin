"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BankLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  withText?: boolean;
}

export function BankLogo({ className, size = "md", withText = false }: BankLogoProps) {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const iconSize = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0 group", iconSize)}>
        {/* Outer Tech Glowing Ring */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-blue-600 opacity-80 blur-[6px] group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Core Icon Container */}
        <div className="relative w-full h-full rounded-xl bg-slate-950 border border-indigo-500/40 p-1.5 flex items-center justify-center shadow-lg overflow-hidden">
          {/* Neural Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0,transparent_70%)] pointer-events-none" />
          
          {/* Techy Vector Bank Digital Twin Emblem */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full relative z-10"
          >
            <defs>
              <linearGradient id="twinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>

            {/* Bank Roof / Triangular Header */}
            <path
              d="M16 4L4 11H28L16 4Z"
              fill="url(#twinGrad)"
            />

            {/* Bank Pillars as Vector Twin Nodes */}
            <rect x="6.5" y="13" width="3" height="10" rx="1.5" fill="url(#twinGrad)" opacity="0.9" />
            <rect x="11.5" y="13" width="3" height="10" rx="1.5" fill="url(#twinGrad)" opacity="0.9" />
            <rect x="17.5" y="13" width="3" height="10" rx="1.5" fill="url(#twinGrad)" opacity="0.9" />
            <rect x="22.5" y="13" width="3" height="10" rx="1.5" fill="url(#twinGrad)" opacity="0.9" />

            {/* Base Line with Data Nodes */}
            <path
              d="M3 25H29"
              stroke="url(#twinGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Twin Circuit Connection Dots */}
            <circle cx="8" cy="27.5" r="1.5" fill="#38bdf8" />
            <circle cx="16" cy="27.5" r="1.5" fill="#818cf8" />
            <circle cx="24" cy="27.5" r="1.5" fill="#c084fc" />
          </svg>
        </div>
      </div>

      {withText && (
        <div className="flex flex-col whitespace-nowrap">
          <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-1.5">
            Bank Digital Twin
          </span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            Quantitative Risk & Stress Engine
          </span>
        </div>
      )}
    </div>
  );
}

export default BankLogo;
