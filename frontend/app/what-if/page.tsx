"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Sliders, RefreshCw, AlertTriangle, ShieldCheck, TrendingDown, Activity, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { runWhatIfSimulation, createScenario } from "@/lib/api";
import { useRouter } from "next/navigation";

interface ImpactData {
  estimated_losses: number;
  post_stress_car: number;
  baseline_car: number;
  post_stress_npl: number;
  baseline_npl: number;
  liquidity_ratio: number;
  baseline_liquidity: number;
  capital_shortfall: number;
  risk_level: string;
  tier1_capital_remaining: number;
  sensitivities?: SensitivityItem[];
}

interface SensitivityItem {
  factor: string;
  label: string;
  impact_pct: number;
}

export default function WhatIfPage() {
  const router = useRouter();
  const [unemployment, setUnemployment] = useState(5.0);
  const [rate, setRate] = useState(2.0);
  const [propertyDrop, setPropertyDrop] = useState(15.0);
  const [depositOutflow, setDepositOutflow] = useState(10.0);

  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [sensitivities, setSensitivities] = useState<SensitivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Instant real-time sensitivity calculation while dragging sliders
  const dynamicSensitivities = useMemo(() => {
    const totOut = 150_000_000;
    const rwa = 105_000_000;

    const unempImpact = Number(((1.8 * (unemployment / 100.0) * 0.12 * totOut / rwa) * 100).toFixed(2));
    const rateImpact = Number(((1.2 * (rate / 100.0) * 0.12 * totOut / rwa) * 100).toFixed(2));
    const propImpact = Number(((0.6 * (propertyDrop / 100.0) * 0.12 * totOut / rwa) * 100).toFixed(2));
    const depositImpact = Number((((depositOutflow / 100.0) * 0.10 * totOut / rwa) * 100).toFixed(2));

    const items: SensitivityItem[] = [
      { factor: "unemployment_shock", label: `Unemployment Rate Shock (+${unemployment.toFixed(1)}%)`, impact_pct: Math.max(0.01, unempImpact) },
      { factor: "rate_shock", label: `Interest Rate Hike (+${rate.toFixed(1)}%)`, impact_pct: Math.max(0.01, rateImpact) },
      { factor: "property_price_drop", label: `Property Price Drop (-${propertyDrop.toFixed(1)}%)`, impact_pct: Math.max(0.01, propImpact) },
      { factor: "deposit_outflow_pct", label: `Deposit Outflow Shock (-${depositOutflow.toFixed(1)}%)`, impact_pct: Math.max(0.01, depositImpact) },
    ];

    items.sort((a, b) => b.impact_pct - a.impact_pct);
    return items;
  }, [unemployment, rate, propertyDrop, depositOutflow]);

  const runSim = useCallback(async () => {
    setLoading(true);
    try {
      const res = await runWhatIfSimulation({
        unemployment_shock: unemployment / 100.0,
        rate_shock: rate / 100.0,
        property_price_drop: propertyDrop / 100.0,
        deposit_outflow_pct: depositOutflow / 100.0,
      });
      setImpact(res);
      if (res.sensitivities && res.sensitivities.length > 0) {
        setSensitivities(res.sensitivities);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [unemployment, rate, propertyDrop, depositOutflow]);

  useEffect(() => {
    runSim();
  }, [runSim]);


  const handleReset = () => {
    setUnemployment(5.0);
    setRate(2.0);
    setPropertyDrop(15.0);
    setDepositOutflow(10.0);
  };

  const handleSaveScenario = async () => {
    setSaving(true);
    try {
      await createScenario({
        title: `What-If Custom (${unemployment}% Unemp, ${rate}% Rate)`,
        description: `Custom scenario created from What-If simulator. Property drop: ${propertyDrop}%, Deposit outflow: ${depositOutflow}%.`,
        unemployment_shock: unemployment / 100.0,
        rate_shock: rate / 100.0,
        horizon_months: 24,
        n_sims: 1000,
        risk_level: (impact?.risk_level as any) || "High",
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e) {
      console.error("Failed to save scenario", e);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  const maxImpact = Math.max(...sensitivities.map((s) => s.impact_pct), 0.1);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">What-If Interactive Simulator</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Fast surrogate response model (<span className="text-cyan-400 font-mono">⚡ &lt;50ms</span>) for real-time hypothesis testing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset Sliders</span>
          </button>

          <button
            onClick={handleSaveScenario}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-cyan-900/20 transition disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Saved to Library!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save to Scenario Library"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders Panel */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <span>Macro Stress Parameters</span>
          </h2>

          {/* Slider 1 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300 font-medium">Unemployment Rate Shock</span>
              <span className="text-cyan-400 font-mono font-bold">+{unemployment.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={unemployment}
              onChange={(e) => setUnemployment(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0% (Baseline)</span>
              <span>15% (Moderate)</span>
              <span>30% (Severe)</span>
            </div>
          </div>

          {/* Slider 2 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300 font-medium">Interest Rate Hike</span>
              <span className="text-cyan-400 font-mono font-bold">+{rate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.25"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0% (Stable)</span>
              <span>5% (Hawkish)</span>
              <span>10% (Extreme)</span>
            </div>
          </div>

          {/* Slider 3 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300 font-medium">Commercial Property Price Drop</span>
              <span className="text-cyan-400 font-mono font-bold">-{propertyDrop.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={propertyDrop}
              onChange={(e) => setPropertyDrop(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0% (No change)</span>
              <span>25% (Correction)</span>
              <span>50% (CRE Crash)</span>
            </div>
          </div>

          {/* Slider 4 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300 font-medium">Deposit Outflow %</span>
              <span className="text-cyan-400 font-mono font-bold">-{depositOutflow.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={depositOutflow}
              onChange={(e) => setDepositOutflow(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0% (Normal)</span>
              <span>20% (Run risk)</span>
              <span>40% (Panic)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Impact Dashboard */}
        <div className="lg:col-span-7 space-y-6">
          {impact ? (
            <>
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Net Losses */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between text-slate-400 text-sm">
                    <span>Estimated Net Losses</span>
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-bold text-rose-400 font-mono mt-2">
                    {formatCurrency(impact.estimated_losses)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Tier 1 Capital remaining: <span className="text-slate-300">{formatCurrency(impact.tier1_capital_remaining)}</span>
                  </div>
                </div>

                {/* Risk Level */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between text-slate-400 text-sm">
                    <span>Solvency Risk Level</span>
                    {impact.risk_level === "Critical" || impact.risk_level === "High" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-3 py-1 text-sm font-bold rounded-md uppercase tracking-wider ${
                        impact.risk_level === "Critical"
                          ? "bg-rose-500/20 border border-rose-500/30 text-rose-400"
                          : impact.risk_level === "High"
                          ? "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                          : impact.risk_level === "Medium"
                          ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                          : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      {impact.risk_level} Solvency Risk
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Capital Deficit: <span className="text-slate-300 font-mono">{formatCurrency(impact.capital_shortfall)}</span>
                  </div>
                </div>

                {/* CAR % Gauge Comparison */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                  <div className="text-sm text-slate-400">Capital Adequacy Ratio (CAR)</div>
                  <div className="flex items-baseline space-x-3 mt-2">
                    <span className="text-2xl font-bold text-white font-mono">{impact.post_stress_car}%</span>
                    <span className="text-xs text-slate-400">vs Baseline {impact.baseline_car}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        impact.post_stress_car >= 8.0 ? "bg-emerald-400" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, (impact.post_stress_car / 20.0) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Regulatory Min: 8.0%</span>
                    <span>{impact.post_stress_car >= 8.0 ? "Pass ✅" : "Breach ❌"}</span>
                  </div>
                </div>

                {/* NPL % Gauge Comparison */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                  <div className="text-sm text-slate-400">Non-Performing Loan (NPL %)</div>
                  <div className="flex items-baseline space-x-3 mt-2">
                    <span className="text-2xl font-bold text-white font-mono">{impact.post_stress_npl}%</span>
                    <span className="text-xs text-slate-400">vs Baseline {impact.baseline_npl}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        impact.post_stress_npl < 10.0 ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                      style={{ width: `${Math.min(100, (impact.post_stress_npl / 30.0) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Threshold: &lt;10.0%</span>
                    <span>{impact.post_stress_npl < 10.0 ? "Normal" : "Elevated Risk"}</span>
                  </div>
                </div>
              </div>

              {/* Sensitivity Tornado Ranking Chart */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">
                    Sensitivity Tornado Ranking (CAR % Reduction by Macro Factor)
                  </h3>
                  <span className="text-xs text-cyan-400 font-mono">⚡ Dynamic Real-Time Ranking</span>
                </div>

                {/* Custom Crisp Horizontal Tornado Bar Visualization */}
                <div className="space-y-3 pt-2">
                  {(() => {
                    const activeList = dynamicSensitivities.length > 0 ? dynamicSensitivities : sensitivities;
                    const maxVal = Math.max(...activeList.map((s) => s.impact_pct), 0.1);
                    return activeList.map((s, idx) => {
                      const widthPct = Math.min(100, Math.max(5, (s.impact_pct / maxVal) * 100));
                      return (
                        <div key={s.factor} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300 font-medium">
                              {idx + 1}. {s.label}
                            </span>
                            <span className="text-cyan-400 font-mono font-bold">-{s.impact_pct.toFixed(2)}% CAR Drop</span>
                          </div>
                          <div className="w-full bg-slate-950 h-3.5 rounded-md p-0.5 border border-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-md shadow-cyan-500/20"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            </>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500">
              {loading ? "Computing simulation..." : "Adjust sliders to simulate balance sheet impacts."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
