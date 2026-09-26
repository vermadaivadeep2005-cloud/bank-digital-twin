"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { KpiTimePoint } from "@/types/api";

interface TrendLineChartProps {
  data: KpiTimePoint[];
}

interface TooltipItem {
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl font-mono text-xs text-slate-200">
        <p className="font-semibold text-white mb-1">{label}</p>
        <p className="text-emerald-400">CAR: {payload.find((p) => p.dataKey === "car")?.value.toFixed(2)}%</p>
        <p className="text-rose-400">NPL Ratio: {payload.find((p) => p.dataKey === "npl_ratio")?.value.toFixed(2)}%</p>
        <p className="text-sky-400">ROA: {payload.find((p) => p.dataKey === "roa")?.value.toFixed(2)}%</p>
      </div>
    );
  }
  return null;
};

export function TrendLineChart({ data }: TrendLineChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm p-4">No trend history available.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-4 text-[11px] font-mono mb-1">
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> CAR %
        </span>
        <span className="flex items-center gap-1 text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> NPL Ratio %
        </span>
        <span className="flex items-center gap-1 text-sky-400">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> ROA %
        </span>
      </div>

      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              domain={[0, "auto"]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="car" name="CAR %" stroke="#10b981" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="npl_ratio" name="NPL %" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="roa" name="ROA %" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TrendLineChart;
