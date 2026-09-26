"use client";

import * as React from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StressTestPayload } from "@/types/api";

const PRESETS = [
  { label: "Baseline", unemp: 0.0, rate: 0.0, horizon: 24, sims: 1000 },
  { label: "Mild Shock", unemp: 0.03, rate: 0.01, horizon: 24, sims: 1000 },
  { label: "2008 Crisis", unemp: 0.10, rate: -0.02, horizon: 36, sims: 2000 },
  { label: "Rate Spike", unemp: 0.04, rate: 0.04, horizon: 24, sims: 1000 },
  { label: "COVID Shock", unemp: 0.12, rate: -0.01, horizon: 24, sims: 1500 },
];

interface ScenarioFormProps {
  onSubmit: (payload: StressTestPayload) => void;
  loading: boolean;
  initialParams?: Partial<StressTestPayload>;
}

export function ScenarioForm({ onSubmit, loading, initialParams }: ScenarioFormProps) {
  const [scenarioName, setScenarioName] = React.useState(initialParams?.scenario_name || "Custom Stress Scenario");
  const [unemploymentShock, setUnemploymentShock] = React.useState(initialParams?.unemployment_shock ?? 0.05);
  const [rateShock, setRateShock] = React.useState(initialParams?.rate_shock ?? 0.02);
  const [nSims, setNSims] = React.useState(initialParams?.n_sims ?? 1000);
  const [horizonMonths, setHorizonMonths] = React.useState(initialParams?.horizon_months ?? 24);
  const [activePreset, setActivePreset] = React.useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.label);
    const newTitle = `${preset.label} Scenario`;
    setScenarioName(newTitle);
    setUnemploymentShock(preset.unemp);
    setRateShock(preset.rate);
    setHorizonMonths(preset.horizon);
    setNSims(preset.sims);

    onSubmit({
      scenario_name: newTitle,
      unemployment_shock: preset.unemp,
      rate_shock: preset.rate,
      n_sims: preset.sims,
      horizon_months: preset.horizon,
      seed: Math.floor(Math.random() * 100000),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      scenario_name: scenarioName,
      unemployment_shock: unemploymentShock,
      rate_shock: rateShock,
      n_sims: nSims,
      horizon_months: horizonMonths,
      seed: Math.floor(Math.random() * 100000),
    });
  };

  const getSeverityBadge = () => {
    const totalShock = unemploymentShock * 1.5 + Math.abs(rateShock);
    if (totalShock >= 0.20) return { label: "CRITICAL SEVERITY", variant: "danger" as const };
    if (totalShock >= 0.10) return { label: "HIGH STRESS", variant: "warning" as const };
    if (totalShock >= 0.04) return { label: "MODERATE STRESS", variant: "info" as const };
    return { label: "BASELINE / MILD", variant: "success" as const };
  };

  const severity = getSeverityBadge();

  return (
    <Card className="sticky top-20 border-indigo-500/30 bg-slate-900/90 shadow-2xl backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </div>
          <div>
            <CardTitle className="text-base text-white">Scenario Configurator</CardTitle>
            <CardDescription className="text-xs">Adjust Basel III macroeconomic shock vectors</CardDescription>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Presets Catalog */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
              Macro Scenario Presets
            </label>
            <Badge variant={severity.variant} className="text-[10px]">
              {severity.label}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const isActive = activePreset === p.label;
              return (
                <button
                  key={p.label}
                  type="button"
                  disabled={loading}
                  onClick={() => applyPreset(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                      : "bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scenario Name Input */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">Scenario Title</label>
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => {
              setScenarioName(e.target.value);
              setActivePreset(null);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-sans"
            required
          />
        </div>

        {/* Unemployment Shock Slider */}
        <div className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Unemployment Shock Spike</span>
            <span className="font-mono font-bold text-rose-400 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
              +{(unemploymentShock * 100).toFixed(1)} pp
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.25"
            step="0.005"
            value={unemploymentShock}
            onChange={(e) => {
              setUnemploymentShock(parseFloat(e.target.value));
              setActivePreset(null);
            }}
            className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-400">Multiplies baseline borrower default probabilities (PD)</p>
        </div>

        {/* Interest Rate Shock Slider */}
        <div className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Interest Rate Shock</span>
            <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
              {rateShock >= 0 ? `+${(rateShock * 100).toFixed(1)}` : (rateShock * 100).toFixed(1)} pp
            </span>
          </div>
          <input
            type="range"
            min="-0.03"
            max="0.08"
            step="0.005"
            value={rateShock}
            onChange={(e) => {
              setRateShock(parseFloat(e.target.value));
              setActivePreset(null);
            }}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-400">Shifts loan interest yield and borrower debt service burden</p>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 focus:outline-none cursor-pointer"
          >
            {showAdvanced ? "Hide Advanced Options" : "Show Advanced Simulation Settings..."}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-mono">Simulation Paths (n_sims)</label>
                <select
                  value={nSims}
                  onChange={(e) => setNSims(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value={500}>500 Paths (Fastest)</option>
                  <option value={1000}>1,000 Paths (Balanced Standard)</option>
                  <option value={2500}>2,500 Paths (High Precision)</option>
                  <option value={5000}>5,000 Paths (Full Monte Carlo Matrix)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-mono">Horizon (Months)</label>
                <select
                  value={horizonMonths}
                  onChange={(e) => setHorizonMonths(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={24}>24 Months (2 Years)</option>
                  <option value={36}>36 Months (3 Years)</option>
                  <option value={60}>60 Months (5 Years)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Submit Run Button */}
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full py-3 shadow-lg shadow-indigo-600/30 font-bold tracking-wide uppercase text-xs"
        >
          {loading ? (
            <span>Simulating {nSims} Vector Paths...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run Monte Carlo Stress Engine</span>
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

export default ScenarioForm;
