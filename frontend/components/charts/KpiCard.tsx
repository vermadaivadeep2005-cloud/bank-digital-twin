"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, LucideIcon, Info, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string;
  suffix?: string;
  delta?: string;
  isPositive?: boolean;
  hint?: string;
  icon?: LucideIcon;
  sparklineData?: number[];
  className?: string;
}

export function KpiCard({
  label,
  value,
  suffix = "",
  delta,
  isPositive = true,
  hint,
  icon: Icon,
  sparklineData = [10, 12, 11, 15, 14, 18, 17, 20],
  className,
}: KpiCardProps) {
  const chartData = sparklineData.map((val, i) => ({ i, val }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group [perspective:1000px] h-[132px] w-full"
    >
      <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] cursor-pointer">
        {/* FRONT FACE */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-4 shadow-xl text-slate-100 flex flex-col justify-between overflow-hidden",
            className
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {Icon && (
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400 font-semibold">
                {label}
              </span>
            </div>

            {delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-semibold font-mono px-2 py-0.5 rounded-full border",
                  isPositive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {delta}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {value}
              </span>
              {suffix && (
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  {suffix}
                </span>
              )}
            </div>

            {/* Mini Sparkline Chart */}
            <div className="w-20 h-8 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="val"
                    stroke={isPositive ? "#34d399" : "#f87171"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
            <span>Hover to inspect details</span>
            <RotateCw className="w-3 h-3 text-indigo-400 animate-pulse" />
          </div>
        </div>

        {/* BACK FACE (FLIP SIDE) */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-4 shadow-2xl text-slate-100 flex flex-col justify-between overflow-hidden",
            className
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest uppercase text-indigo-400 font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              {label} Analytics
            </span>
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              Live Vector
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-snug line-clamp-3 font-normal mt-1">
            {hint || `Real-time calculation metric for ${label}. Monitors portfolio stability and Basel III adequacy.`}
          </p>

          <div className="flex items-center justify-between text-[11px] font-mono border-t border-indigo-500/20 pt-1.5">
            <span className="text-slate-400">Current Level:</span>
            <span className="text-white font-bold">{value}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default KpiCard;
