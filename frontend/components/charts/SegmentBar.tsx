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
import { SegmentImpact } from "@/types/api";
import { formatCurrency, formatPercent } from "@/lib/format";

interface SegmentBarProps {
  data: SegmentImpact[];
  title: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: SegmentImpact;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl font-mono text-xs text-slate-200">
        <p className="font-semibold text-white capitalize">{item.category}</p>
        <p className="text-indigo-400">Expected Loss: {formatCurrency(item.expected_loss, true)}</p>
        <p className="text-rose-400">Default Rate: {formatPercent(item.loss_pct)}</p>
      </div>
    );
  }
  return null;
};

import CroMathBreakdown from "@/components/common/CroMathBreakdown";

export function SegmentBar({ data, title }: SegmentBarProps) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm p-4">No segment data.</div>;
  }

  const COLORS = ["#6366f1", "#38bdf8", "#fbbf24", "#f43f5e", "#a855f7", "#34d399"];

  return (
    <div className="w-full space-y-3">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">{title}</h4>
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => formatCurrency(v, true)} />
            <YAxis type="category" dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="expected_loss" radius={[0, 6, 6, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <CroMathBreakdown
        title={`Segment Concentration Methodology — ${title}`}
        methodology="Evaluates portfolio risk concentration across loan asset classes and regional geographies under stressed LGD vectors."
        steps={[
          {
            step: 1,
            title: "Segment Risk-Weighted Loss Aggregation",
            formula: "Segment_Loss_k = Sum_{i in Segment_k}( Exposure_i * PD_i * LGD_i * (1 + Shock) )",
            explanation: "Aggregates segment loss expectation by applying asset-specific Loss Given Default (LGD) factors.",
          },
          {
            step: 2,
            title: "Segment Concentration Loss Rate (%)",
            formula: "Loss_Rate_k = ( Segment_Loss_k / Segment_Total_Outstanding_k ) * 100%",
            explanation: "Calculates the percentage credit loss rate relative to total outstanding principal in that segment.",
          },
        ]}
      />
    </div>
  );
}

export default SegmentBar;
