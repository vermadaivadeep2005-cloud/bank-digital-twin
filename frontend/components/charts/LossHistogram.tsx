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
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface LossHistogramProps {
  losses: number[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      rangeMin: number;
      rangeMax: number;
      count: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl font-mono text-xs text-slate-200">
        <p className="font-semibold text-white">Loss Range:</p>
        <p className="text-indigo-400">
          {formatCurrency(data.rangeMin, true)} – {formatCurrency(data.rangeMax, true)}
        </p>
        <p className="text-slate-300 mt-1">Frequency: {data.count} simulations</p>
      </div>
    );
  }
  return null;
};

export function LossHistogram({ losses }: LossHistogramProps) {
  if (!losses || losses.length === 0) {
    return <div className="text-slate-500 text-sm p-4">No loss distribution data.</div>;
  }

  const minLoss = Math.min(...losses);
  const maxLoss = Math.max(...losses);
  const binWidth = (maxLoss - minLoss) / 12 || 1;

  const bins = Array.from({ length: 12 }, (_, i) => {
    const rangeMin = minLoss + i * binWidth;
    const rangeMax = rangeMin + binWidth;
    const count = losses.filter((l) => l >= rangeMin && (i === 11 ? l <= rangeMax : l < rangeMax)).length;
    return {
      binLabel: formatCurrency(rangeMin + binWidth / 2, true),
      rangeMin,
      rangeMax,
      count,
    };
  });

  const getColor = (rangeMin: number) => {
    const p75 = minLoss + (maxLoss - minLoss) * 0.70;
    const p40 = minLoss + (maxLoss - minLoss) * 0.35;
    if (rangeMin >= p75) return "#f43f5e";
    if (rangeMin >= p40) return "#fbbf24";
    return "#34d399";
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="binLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {bins.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.rangeMin)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LossHistogram;
