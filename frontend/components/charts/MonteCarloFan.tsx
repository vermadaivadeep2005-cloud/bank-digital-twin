"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import CroMathBreakdown from "@/components/common/CroMathBreakdown";

interface MonteCarloFanProps {
  paths: {
    p5: number[];
    p50: number[];
    p95: number[];
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl font-mono text-xs text-slate-200">
        <p className="font-semibold text-white mb-1.5">{label}</p>
        <div className="space-y-1">
          <p className="text-emerald-400">
            Best Case (P95): {formatCurrency(payload.find((p) => p.dataKey === "p95")?.value || 0, true)}
          </p>
          <p className="text-indigo-400">
            Median (P50): {formatCurrency(payload.find((p) => p.dataKey === "p50")?.value || 0, true)}
          </p>
          <p className="text-rose-400">
            Adverse (P5): {formatCurrency(payload.find((p) => p.dataKey === "p5")?.value || 0, true)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function MonteCarloFan({ paths }: MonteCarloFanProps) {
  if (!paths || !paths.p50 || paths.p50.length === 0) {
    return <div className="text-slate-500 text-sm p-4">No capital path data available.</div>;
  }

  const data = paths.p50.map((_, idx) => ({
    month: idx === 0 ? "M0" : `M${idx}`,
    p5: paths.p5[idx] || 0,
    p50: paths.p50[idx] || 0,
    p95: paths.p95[idx] || 0,
  }));

  const allVals = data.flatMap((d) => [d.p5, d.p50, d.p95]).filter((v) => typeof v === "number" && !isNaN(v));
  const minVal = allVals.length > 0 ? Math.min(...allVals) : 0;
  const maxVal = allVals.length > 0 ? Math.max(...allVals) : 1000;
  const padding = (maxVal - minVal) * 0.15 || maxVal * 0.05;
  const yDomain: [number, number] = [Math.max(0, Math.floor(minVal - padding)), Math.ceil(maxVal + padding)];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="p95Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="p5Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            domain={yDomain}
            tickFormatter={(v) => formatCurrency(v, true)}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="p95"
            name="Best Case (P95)"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#p95Gradient)"
          />
          <Area
            type="monotone"
            dataKey="p50"
            name="Median (P50)"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="none"
          />
          <Area
            type="monotone"
            dataKey="p5"
            name="Adverse (P5)"
            stroke="#f43f5e"
            strokeWidth={2}
            fill="url(#p5Gradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* CRO Math Breakdown for Monte Carlo Trajectories */}
      <CroMathBreakdown
        title="Monte Carlo Capital Trajectory & Quantile Bounds Methodology"
        methodology="Simulates 60-month Tier 1 capital paths by integrating Net Interest Income (NII) accumulation against monthly credit loss draws."
        steps={[
          {
            step: 1,
            title: "Capital Accumulation Difference Equation",
            formula: "Capital_(t+1) = Capital_t + NII_(t+1) - Monthly_Losses_(t+1)",
            explanation: "Models monthly capital position as previous capital plus Net Interest Margin earnings minus credit losses.",
          },
          {
            step: 2,
            title: "Time-Evolving Macro Stress Profile",
            formula: "Stress_Profile(m) = 0.4 + 0.9 * sin( pi * m / 24 )",
            explanation: "Simulates crisis build-up phase peaking around month 12 to 16 before stabilizing.",
          },
          {
            step: 3,
            title: "Path Quantile Bounds (P5 Adverse / P50 Median / P95 Best)",
            formula: "P_k(t) = Quantile_k( { Capital_path_i(t) } )",
            explanation: "Extracts 5th percentile (stress path), 50th percentile (median), and 95th percentile (optimistic path) across all simulated trajectories.",
          },
        ]}
      />
    </div>
  );
}

export default MonteCarloFan;
