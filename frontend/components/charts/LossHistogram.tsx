"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface LossHistogramProps {
  losses: number[];
  meanLoss?: number;
  p95Loss?: number;
  worstCaseLoss?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      rangeMin: number;
      rangeMax: number;
      count: number;
      pct: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-indigo-500/30 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-slate-200">
        <p className="font-semibold text-white mb-1 flex items-center justify-between gap-3">
          <span>Loss Range:</span>
          <span className="text-indigo-400 font-bold">{data.pct.toFixed(1)}% of paths</span>
        </p>
        <p className="text-slate-300">
          {formatCurrency(data.rangeMin, true)} – {formatCurrency(data.rangeMax, true)}
        </p>
        <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Simulated Frequency:</span>
          <span className="font-bold text-white">{data.count} paths</span>
        </div>
      </div>
    );
  }
  return null;
};

export function LossHistogram({ losses, meanLoss, p95Loss, worstCaseLoss }: LossHistogramProps) {
  if (!losses || losses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-xs font-mono">
        No loss distribution data available. Run simulation to generate paths.
      </div>
    );
  }

  const minLoss = Math.min(...losses);
  const maxLoss = Math.max(...losses);
  const totalCount = losses.length;
  const binWidth = (maxLoss - minLoss) / 12 || 1;

  const bins = Array.from({ length: 12 }, (_, i) => {
    const rangeMin = minLoss + i * binWidth;
    const rangeMax = rangeMin + binWidth;
    const count = losses.filter((l) => l >= rangeMin && (i === 11 ? l <= rangeMax : l < rangeMax)).length;
    const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
    
    // Find label closest matching for reference lines
    const midValue = rangeMin + binWidth / 2;
    return {
      binLabel: formatCurrency(midValue, true),
      midValue,
      rangeMin,
      rangeMax,
      count,
      pct,
    };
  });

  const getColor = (rangeMin: number) => {
    const range = maxLoss - minLoss || 1;
    const norm = (rangeMin - minLoss) / range;
    if (norm >= 0.70) return "#f43f5e"; // Severe Rose
    if (norm >= 0.35) return "#fbbf24"; // Warning Amber
    return "#10b981"; // Healthy Emerald
  };

  // Find nearest bin label for Mean and P95 reference lines
  const getNearestBinLabel = (targetVal?: number) => {
    if (targetVal === undefined) return null;
    let closestBin = bins[0];
    let minDiff = Math.abs(bins[0].midValue - targetVal);
    for (const b of bins) {
      const diff = Math.abs(b.midValue - targetVal);
      if (diff < minDiff) {
        minDiff = diff;
        closestBin = b;
      }
    }
    return closestBin.binLabel;
  };

  const meanLabel = getNearestBinLabel(meanLoss);
  const p95Label = getNearestBinLabel(p95Loss);

  return (
    <div className="w-full space-y-3">
      {/* Dynamic Summary Micro-Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Normal Loss (&lt;35%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Moderate Stress (35–70%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Severe Tail Loss (&gt;70%)</span>
          </span>
        </div>

        {meanLoss !== undefined && p95Loss !== undefined && (
          <div className="flex items-center gap-3 text-slate-300">
            <span className="text-indigo-400 font-medium">Mean: {formatCurrency(meanLoss, true)}</span>
            <span className="text-amber-400 font-medium">P95 VaR: {formatCurrency(p95Loss, true)}</span>
          </div>
        )}
      </div>

      {/* Dynamic Recharts Bar Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis
              dataKey="binLabel"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              interval={0}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Mean Loss Marker Line */}
            {meanLabel && (
              <ReferenceLine
                x={meanLabel}
                stroke="#818cf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: "MEAN",
                  fill: "#818cf8",
                  fontSize: 10,
                  position: "top",
                  fontWeight: "bold",
                }}
              />
            )}

            {/* P95 VaR Marker Line */}
            {p95Label && (
              <ReferenceLine
                x={p95Label}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: "P95 VaR",
                  fill: "#f59e0b",
                  fontSize: 10,
                  position: "top",
                  fontWeight: "bold",
                }}
              />
            )}

            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {bins.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColor(entry.rangeMin)}
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default LossHistogram;
