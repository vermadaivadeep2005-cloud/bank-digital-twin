"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ShieldCheck } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { REGULATORY_PROFILES, RegulatoryProfile } from "@/lib/regulatoryProfiles";
import { StressTestResponse } from "@/types/api";

const MODEL_STYLE = {
  gaussian: { label: "Gaussian", color: "#818cf8" },
  student_t: { label: "Student-t", color: "#c084fc" },
} as const;

export default function RegulatoryStressResults({ result, profile, copulaType }: {
  result: StressTestResponse;
  profile: RegulatoryProfile;
  copulaType: string;
}) {
  const thresholds = REGULATORY_PROFILES[profile];
  const models = (copulaType === "dual" ? ["gaussian", "student_t"] : [copulaType]) as (keyof typeof MODEL_STYLE)[];
  const modelData = models.map((model) => ({ model, style: MODEL_STYLE[model], data: result.model_results?.[model] })).filter((item) => item.data);
  const distributions = modelData.flatMap(({ data }) => data!.capital_ratio_distribution);
  const min = Math.min(...distributions, thresholds.total - 1);
  const max = Math.max(...distributions, thresholds.buffer + 1);
  const binCount = 24;
  const step = Math.max((max - min) / binCount, 0.1);
  const chartData = Array.from({ length: binCount }, (_, index) => {
    const lower = min + index * step;
    const row: Record<string, string | number> = { car: Number(lower.toFixed(2)) };
    modelData.forEach(({ model, data }) => {
      const values = data!.capital_ratio_distribution;
      row[model] = values.filter((value) => value >= lower && value < lower + step).length / values.length * 100;
    });
    return row;
  });

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-wrap justify-between gap-3">
          <div>
            <CardTitle className="text-white flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" />Stress Results — {result.scenario_name}</CardTitle>
            <CardDescription className="text-slate-400 mt-1">{thresholds.label} · {(result.params?.n_sims ?? 1000).toLocaleString()} Monte Carlo paths · {result.params?.horizon_months ?? 24} month horizon</CardDescription>
          </div>
          <span className="text-xs text-slate-400 font-mono">Same scenario inputs for each selected model</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm text-left">
            <thead className="text-[11px] uppercase tracking-wide text-slate-400 bg-slate-950/70"><tr>
              <th className="px-5 py-3">Risk Metric</th>{modelData.map(({ model, style }) => <th key={model} className="px-5 py-3" style={{ color: style.color }}>{style.label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-800/70">
              {[
                ["Expected Loss", (model: typeof modelData[number]) => formatCurrency(model.data!.expected_loss, true)],
                ["Tail Loss (P95)", (model: typeof modelData[number]) => formatCurrency(model.data!.tail_loss, true)],
                ["Stressed Capital Ratio", (model: typeof modelData[number]) => `${model.data!.stressed_car.toFixed(2)}%`],
                ["NPL Ratio", (model: typeof modelData[number]) => `${model.data!.npl_ratio.toFixed(2)}%`],
              ].map(([label, display]) => <tr key={label as string}>
                <td className="px-5 py-3 text-slate-300">{label as string}</td>{modelData.map((model) => <td key={model.model} className="px-5 py-3 text-white font-mono">{(display as (item: typeof modelData[number]) => string)(model)}</td>)}
              </tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <CardTitle className="text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" />Regulatory Capital Impact — {thresholds.label}</CardTitle>
          <CardDescription className="text-slate-400 mt-1">Capital ratios and breach probabilities calculated from each model&apos;s simulated capital paths.</CardDescription>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm text-left">
            <thead className="text-[11px] uppercase text-slate-400 bg-slate-950/70"><tr><th className="px-5 py-3">Capital Requirement</th><th className="px-5 py-3">Minimum</th>{modelData.map(({ model, style }) => <th key={model} className="px-5 py-3" style={{ color: style.color }}>{style.label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-800/70">
              {([
                ["CET1", thresholds.cet1, 0.58], ["Tier 1", thresholds.tier1, 0.70], ["Total Capital", thresholds.total, 1], ["Capital Buffer", thresholds.buffer, 1],
              ] as const).map(([label, minimum, ratio]) => <tr key={label}>
                <td className="px-5 py-3 text-slate-300">{label}</td><td className="px-5 py-3 text-slate-400 font-mono">{minimum.toFixed(1)}%</td>
                {modelData.map(({ model, data }) => { const value = data!.stressed_car * ratio; const breached = value < minimum; return <td key={model} className={`px-5 py-3 font-mono ${breached ? "text-rose-400" : "text-emerald-400"}`}>{value.toFixed(2)}% <span className="text-[10px]">{breached ? "BREACH" : "PASS"}</span></td>; })}
              </tr>)}
              <tr><td className="px-5 py-3 text-slate-300">Minimum Capital Breach Probability</td><td className="px-5 py-3 text-slate-400 font-mono">{thresholds.total.toFixed(1)}%</td>{modelData.map(({ model, data, style }) => { const values = data!.capital_ratio_distribution; const breach = values.filter((value) => value < thresholds.total).length / values.length * 100; return <td key={model} className="px-5 py-3 font-mono" style={{ color: style.color }}>{breach.toFixed(1)}%</td>; })}</tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="bg-slate-900/80 border-slate-800 p-5">
        <div className="mb-4"><CardTitle className="text-white">Simulated Capital Ratio Distribution</CardTitle><CardDescription className="text-slate-400">End of horizon capital ratio across Monte Carlo paths</CardDescription></div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="car" type="number" domain={[min, max]} stroke="#94a3b8" fontSize={10} tickFormatter={(value) => `${Number(value).toFixed(1)}%`} />
            <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#e2e8f0" }} formatter={(value) => [`${Number(value).toFixed(2)}% of paths`, "Frequency"]} />
            <ReferenceLine x={thresholds.total} stroke="#fb7185" strokeDasharray="4 4" label={{ value: `Minimum ${thresholds.total}%`, fill: "#fb7185", fontSize: 10 }} />
            {modelData.map(({ model, style }) => <Line key={model} type="monotone" dataKey={model} name={style.label} stroke={style.color} strokeWidth={2.5} dot={false} />)}
          </LineChart></ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
