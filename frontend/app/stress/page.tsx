"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Building2,
  MapPin,
  Download,
  Printer,
  RotateCcw,
  Zap,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import ScenarioForm from "@/components/stress/ScenarioForm";
import MonteCarloFan from "@/components/charts/MonteCarloFan";
import LossHistogram from "@/components/charts/LossHistogram";
import SegmentBar from "@/components/charts/SegmentBar";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { runStressTest, runReverseStressTest } from "@/lib/api";
import {
  StressTestPayload,
  StressTestResponse,
  ReverseStressResponse,
  TwoWayComparison,
} from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { downloadJson, exportPdfReport } from "@/lib/exportUtils";

function StressContent() {
  const searchParams = useSearchParams();
  const presetUnemp = searchParams.get("unemp");
  const presetRate = searchParams.get("rate");
  const presetName = searchParams.get("name");

  const initialParams: Partial<StressTestPayload> = React.useMemo(
    () => ({
      scenario_name: presetName || "Custom Scenario",
      unemployment_shock: presetUnemp ? parseFloat(presetUnemp) : 0.05,
      rate_shock: presetRate ? parseFloat(presetRate) : 0.02,
    }),
    [presetName, presetUnemp, presetRate]
  );

  // Engine Mode: 'forward' (standard Monte Carlo) vs 'reverse' (Reverse Stress & 2-Way Retest)
  const [engineMode, setEngineMode] = React.useState<"forward" | "reverse">("forward");

  // Forward state
  const [result, setResult] = React.useState<StressTestResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Reverse & 2-Way Retesting state
  const [targetMetric, setTargetMetric] = React.useState<string>("car_breach");
  const [targetValue, setTargetValue] = React.useState<number>(8.0);
  const [reverseCopula, setReverseCopula] = React.useState<"gaussian" | "student_t">("gaussian");
  const [reverseDegreesOfFreedom, setReverseDegreesOfFreedom] = React.useState<number>(5);

  // Management Mitigation Actions
  const [capitalInjection, setCapitalInjection] = React.useState<number>(50000000); // $50M
  const [portfolioDeriskPct, setPortfolioDeriskPct] = React.useState<number>(0.20); // 20%
  const [nplProvisionBoost, setNplProvisionBoost] = React.useState<number>(0.15); // 15%
  const [liquidityDrawdown, setLiquidityDrawdown] = React.useState<number>(25000000); // $25M

  const [reverseResult, setReverseResult] = React.useState<ReverseStressResponse | null>(null);
  const [reverseLoading, setReverseLoading] = React.useState(false);

  // Run forward stress test
  const handleRun = React.useCallback(async (payload: StressTestPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await runStressTest(payload);
      setResult(res);
      toast.success(`Simulation completed: ${res.survived_pct.toFixed(1)}% survival rate`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
          ? err.message
          : "Simulation failed";
      setError(msg || "Simulation failed");
      toast.error(msg || "Simulation failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    let isMounted = true;
    runStressTest({
      scenario_name: initialParams.scenario_name || "Custom Scenario",
      unemployment_shock: initialParams.unemployment_shock ?? 0.05,
      rate_shock: initialParams.rate_shock ?? 0.02,
      copula_type: "gaussian",
      degrees_of_freedom: 5,
      n_sims: 1000,
      horizon_months: 24,
      seed: 42,
    })
      .then((res) => {
        if (isMounted) {
          setResult(res);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : err instanceof Error
              ? err.message
              : "Simulation failed";
          setError(msg || "Simulation failed");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialParams]);

  // Run reverse stress & 2-way testing
  const handleRunReverse = async () => {
    setReverseLoading(true);
    try {
      const res = await runReverseStressTest({
        scenario_name: "Reverse Stress Breaking Point & 2-Way Retest",
        target_metric: targetMetric,
        target_value: targetValue,
        copula_type: reverseCopula,
        degrees_of_freedom: reverseDegreesOfFreedom,
        n_sims: 1000,
        horizon_months: 24,
        actions: {
          capital_injection: capitalInjection,
          portfolio_derisk_pct: portfolioDeriskPct,
          npl_provision_boost: nplProvisionBoost,
          liquidity_facility_drawdown: liquidityDrawdown,
        },
      });
      setReverseResult(res);
      toast.success(`Reverse Stress Audit Complete: ${res.mitigation_status}`);
    } catch (e) {
      console.error(e);
      toast.error("Reverse stress simulation failed");
    } finally {
      setReverseLoading(false);
    }
  };

  const handleCopyJson = () => {
    const dataToCopy = engineMode === "forward" ? result : reverseResult;
    if (!dataToCopy) return;
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setCopied(true);
    toast.success("JSON results copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataToExport = engineMode === "forward" ? result : reverseResult;
    if (!dataToExport) return;
    downloadJson(dataToExport, `stress_simulation_${engineMode}_${Date.now()}.json`);
    toast.success("Downloaded simulation JSON report");
  };

  const handleExportPdfReport = () => {
    if (!result) return;
    const nSims = result.params?.n_sims ?? 1000;
    const horizon = result.params?.horizon_months ?? 24;
    const seed = result.params?.seed ?? 42;
    const copulaLabel = result.copula_label || "Gaussian Copula";

    const segmentRows = (result.segment_breakdown?.by_type || []).map((seg) => [
      seg.category,
      formatCurrency(seg.expected_loss, true),
      `${seg.loss_pct.toFixed(2)}%`,
    ]);

    exportPdfReport({
      title: `Vasicek Monte Carlo Stress Simulation Report — ${result.scenario_name}`,
      subtitle: `Model: ${copulaLabel} | Sims: ${nSims.toLocaleString()} | Horizon: ${horizon}M | Seed: ${seed}`,
      metrics: [
        {
          label: "Survival Rate",
          value: `${result.survived_pct.toFixed(1)}%`,
          detail: result.survived_pct >= 80 ? "Passes Basel Solvency Threshold" : "Capital Deficit Warning",
        },
        { label: "Expected Loss (Mean)", value: formatCurrency(result.summary.expected_loss, true) },
        { label: "Worst Case Loss (P95)", value: formatCurrency(result.summary.worst_case_loss, true) },
        { label: "Median Loss (P50)", value: formatCurrency(result.summary.p50_loss, true) },
        { label: "Initial Capital Base", value: formatCurrency(result.summary.initial_capital, true) },
        { label: "Total Portfolio Size", value: formatCurrency(result.summary.portfolio_size, true) },
      ],
      tables:
        segmentRows.length > 0
          ? [
              {
                title: "Segmented Capital Impact & Risk Exposure Breakdown",
                headers: ["Loan Category", "Stressed Loss ($)", "Loss Rate (%)"],
                rows: segmentRows,
              },
            ]
          : [],
    });
    toast.success("Generated executive PDF stress test report!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Stress Testing Engine</h1>
            <Badge variant="neutral" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs font-mono">
              Vasicek + Copulas
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Vasicek Monte Carlo Engine with Gaussian & Student-t Copulas & Reverse 2-Way Retesting
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportJson} disabled={!result && !reverseResult}>
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportPdfReport} disabled={!result}>
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF Report</span>
          </Button>

          {(result || reverseResult) && (
            <Button variant="outline" size="sm" onClick={handleCopyJson}>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs (Forward Engine vs Reverse Engine) */}
      <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-1.5 backdrop-blur-md">
        <button
          onClick={() => setEngineMode("forward")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition ${
            engineMode === "forward"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900/50"
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Forward Vasicek Stress Engine (Monte Carlo + Copulas)</span>
        </button>

        <button
          onClick={() => {
            setEngineMode("reverse");
            if (!reverseResult) {
              handleRunReverse();
            }
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition ${
            engineMode === "reverse"
              ? "bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-amber-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900/50"
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reverse Stress & 2-Way Retesting Engine</span>
        </button>
      </div>

      {/* MODE 1: FORWARD STRESS ENGINE */}
      {engineMode === "forward" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Scenario Form */}
          <div className="lg:col-span-1">
            <ScenarioForm onSubmit={handleRun} loading={loading} initialParams={initialParams} />
            {error && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <p className="font-semibold mb-1">Simulation Error</p>
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Dashboard Results */}
          <div className="lg:col-span-2 space-y-6">
            {loading && (
              <Card className="space-y-4 p-8 text-center bg-slate-900/80 border-slate-800">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Running Vectorized Copula Simulation...</p>
                <p className="text-xs text-slate-400 font-mono">
                  Evaluating joint default probabilities across Monte Carlo macro factor paths
                </p>
                <Skeleton className="h-48 mt-4" />
              </Card>
            )}

            {!loading && result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Copula Badge Notice */}
                {result.copula_label && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-mono">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span>Copula Model Active: <strong>{result.copula_label}</strong></span>
                    </span>
                    <span>Vectorized Paths: {result.params?.n_sims || 1000}</span>
                  </div>
                )}

                {/* Top 4 Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-slate-900/80 border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">Survival Rate</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-bold font-mono text-white">
                        {result.survived_pct.toFixed(1)}%
                      </span>
                      <Badge variant={result.survived_pct >= 95 ? "success" : result.survived_pct >= 80 ? "warning" : "danger"}>
                        {result.survived_pct >= 95 ? "PASS" : "STRESSED"}
                      </Badge>
                    </div>
                  </Card>

                  <Card className="p-4 bg-slate-900/80 border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">Expected Loss</span>
                    <div className="mt-1">
                      <span className="text-2xl font-bold font-mono text-indigo-400">
                        {formatCurrency(result.summary.expected_loss, true)}
                      </span>
                    </div>
                  </Card>

                  <Card className="p-4 bg-slate-900/80 border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">P95 VaR Loss</span>
                    <div className="mt-1">
                      <span className="text-2xl font-bold font-mono text-amber-400">
                        {formatCurrency(result.summary.p95_loss, true)}
                      </span>
                    </div>
                  </Card>

                  <Card className="p-4 bg-slate-900/80 border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">Worst Case</span>
                    <div className="mt-1">
                      <span className="text-2xl font-bold font-mono text-rose-400">
                        {formatCurrency(result.summary.worst_case_loss, true)}
                      </span>
                    </div>
                  </Card>
                </div>

                {/* Loss Histogram */}
                <Card className="bg-slate-900/80 border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <CardTitle className="text-white">Loss Distribution Severity</CardTitle>
                      <CardDescription className="text-slate-400">
                        Histogram of portfolio losses under {result.copula_label || "Vasicek copula"}
                      </CardDescription>
                    </div>
                    <Badge variant="neutral">Frequency Distribution</Badge>
                  </div>
                  <LossHistogram
                    key={`hist_${result.summary.expected_loss}_${result.summary.p95_loss}_${result.survived_pct}`}
                    losses={result.distribution}
                    meanLoss={result.summary.expected_loss}
                    p95Loss={result.summary.p95_loss}
                    worstCaseLoss={result.summary.worst_case_loss}
                  />
                </Card>

                {/* Fan Chart */}
                <Card className="bg-slate-900/80 border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <CardTitle className="text-white">Capital Path Trajectories (P5 / P50 / P95)</CardTitle>
                      <CardDescription className="text-slate-400">Projected Tier 1 capital over horizon</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-emerald-400">P95 Best</span>
                      <span className="text-indigo-400">P50 Median</span>
                      <span className="text-rose-400">P5 Adverse</span>
                    </div>
                  </div>
                  <MonteCarloFan key={`fan_${result.summary.expected_loss}_${result.survived_pct}`} paths={result.capital_paths} />
                </Card>

                {/* Segment Breakdown */}
                {result.segment_breakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-900/80 border-slate-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <CardTitle className="text-sm text-white">Impact by Loan Asset Class</CardTitle>
                      </div>
                      <SegmentBar data={result.segment_breakdown.by_type} title="Losses by Loan Type" />
                    </Card>

                    <Card className="bg-slate-900/80 border-slate-800">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-sky-400" />
                        <CardTitle className="text-sm text-white">Regional Concentration Impact</CardTitle>
                      </div>
                      <SegmentBar data={result.segment_breakdown.by_region.slice(0, 5)} title="Losses by Top Regions" />
                    </Card>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: REVERSE STRESS & 2-WAY MITIGATION TESTING ENGINE */}
      {engineMode === "reverse" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Reverse Configurator & Management Actions */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-20 border-amber-500/30 bg-slate-900/95 shadow-2xl backdrop-blur-xl p-6 space-y-5 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-600/40 scrollbar-track-slate-950/80 pr-3">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base text-white">Reverse Stress Configurator</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Search for critical breaking point shock vector</CardDescription>
                </div>
              </div>

              {/* Target Metric Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Reverse Target Metric</label>
                <select
                  value={targetMetric}
                  onChange={(e) => setTargetMetric(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="car_breach">CAR Breach (&lt; 8.0% Regulatory Minimum)</option>
                  <option value="solvency_breach">Bank Solvency Failure (CAR ≤ 0.0%)</option>
                  <option value="loss_threshold">Expected Loss Threshold ($M)</option>
                </select>
              </div>

              {/* Target Value Input */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-300">Target Metric Value</label>
                  <span className="font-mono text-amber-400 font-bold">
                    {targetMetric === "loss_threshold" ? formatCurrency(targetValue, true) : `${targetValue}%`}
                  </span>
                </div>
                <input
                  type="number"
                  step={targetMetric === "loss_threshold" ? "5000000" : "0.5"}
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* Copula selection for reverse engine */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Reverse Copula Model</span>
                  <Badge variant="info" className="text-[10px]">
                    {reverseCopula === "student_t" ? `Student-t (ν=${reverseDegreesOfFreedom})` : "Gaussian"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReverseCopula("gaussian")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                      reverseCopula === "gaussian" ? "bg-amber-600 text-white font-bold" : "text-slate-400"
                    }`}
                  >
                    Gaussian
                  </button>
                  <button
                    type="button"
                    onClick={() => setReverseCopula("student_t")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                      reverseCopula === "student_t" ? "bg-rose-600 text-white font-bold" : "text-slate-400"
                    }`}
                  >
                    Student's t
                  </button>
                </div>
              </div>

              {/* Management Mitigation Actions Controls */}
              <div className="pt-3 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Management Actions (2-Way Retest)</span>
                  </span>
                </div>

                {/* Capital Injection */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Tier 1 Capital Injection</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatCurrency(capitalInjection, true)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150000000"
                    step="5000000"
                    value={capitalInjection}
                    onChange={(e) => setCapitalInjection(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Portfolio De-risking */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Portfolio De-risking %</span>
                    <span className="font-mono text-cyan-400 font-bold">{(portfolioDeriskPct * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.50"
                    step="0.05"
                    value={portfolioDeriskPct}
                    onChange={(e) => setPortfolioDeriskPct(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* NPL Provision Boost */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Provision Coverage Boost</span>
                    <span className="font-mono text-amber-400 font-bold">{(nplProvisionBoost * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.40"
                    step="0.05"
                    value={nplProvisionBoost}
                    onChange={(e) => setNplProvisionBoost(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <Button
                onClick={handleRunReverse}
                loading={reverseLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold uppercase text-xs shadow-lg shadow-amber-950/40"
              >
                {reverseLoading ? (
                  <span>Searching Breaking Point & Retesting...</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Run Reverse 2-Way Stress Retest</span>
                  </>
                )}
              </Button>
            </Card>
          </div>

          {/* Right Column: 2-Way Retesting Dashboard & Comparison Matrix */}
          <div className="lg:col-span-2 space-y-6">
            {reverseLoading && (
              <Card className="p-8 text-center bg-slate-900/80 border-slate-800">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Reverse Search Engine Active...</p>
                <p className="text-xs text-slate-400 font-mono">
                  Iterating macroeconomic shock space to find critical breaking point & retesting mitigation actions
                </p>
                <Skeleton className="h-48 mt-4" />
              </Card>
            )}

            {!reverseLoading && reverseResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Breaking Point Shock Card */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 border border-amber-500/40 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                        Discovered Breaking Point Shock Vector
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                        <span>Unemployment: +{(reverseResult.breaking_shock.unemployment_shock * 100).toFixed(1)} pp</span>
                        <span className="text-slate-600">|</span>
                        <span>Rate: +{(reverseResult.breaking_shock.rate_shock * 100).toFixed(2)} pp</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">{reverseResult.summary_advisory}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border ${
                          reverseResult.mitigation_status === "RECOVERED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                            : reverseResult.mitigation_status === "PARTIALLY_MITIGATED"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {reverseResult.mitigation_status === "RECOVERED" ? "🟢 RECOVERED" : reverseResult.mitigation_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-Way Side-by-Side Comparison Table */}
                <Card className="bg-slate-900/80 border-slate-800 overflow-hidden shadow-2xl">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Layers className="h-4 w-4 text-amber-400" />
                        <span>2-Way Retesting Matrix (Pre-Mitigation vs Post-Mitigation)</span>
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Side-by-side performance of baseline bank vs mitigated bank under exact same breaking shock
                      </CardDescription>
                    </div>
                    <Badge variant="neutral" className="font-mono text-xs">
                      2-Way Simulation
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950/90 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Key Risk Metric</th>
                          <th className="px-6 py-4 text-rose-400">Pre-Mitigation (Breached)</th>
                          <th className="px-6 py-4 text-emerald-400">Post-Mitigation (Retested)</th>
                          <th className="px-6 py-4">Mitigation Delta</th>
                          <th className="px-6 py-4 text-center">Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
                        {reverseResult.comparison.map((row: TwoWayComparison, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4 font-sans font-semibold text-white">{row.metric_name}</td>
                            <td className="px-6 py-4 text-rose-400 font-bold">{row.pre_mitigation}</td>
                            <td className="px-6 py-4 text-emerald-400 font-bold text-base">{row.post_mitigation}</td>
                            <td className="px-6 py-4 text-cyan-400 font-bold">{row.delta}</td>
                            <td className="px-6 py-4 text-center font-sans">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                  row.status === "RECOVERED"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : row.status === "IMPROVED"
                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Side-by-Side Capital Trajectories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-900/80 border-slate-800">
                    <div className="mb-3">
                      <CardTitle className="text-sm text-rose-400">Pre-Mitigation Stressed Trajectory</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Unmitigated baseline under breaking shock</CardDescription>
                    </div>
                    <MonteCarloFan paths={reverseResult.pre_mitigation_results.capital_paths} />
                  </Card>

                  <Card className="bg-slate-900/80 border-slate-800">
                    <div className="mb-3">
                      <CardTitle className="text-sm text-emerald-400">Post-Mitigation Retested Trajectory</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Mitigated portfolio under breaking shock</CardDescription>
                    </div>
                    <MonteCarloFan paths={reverseResult.post_mitigation_results.capital_paths} />
                  </Card>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StressPage() {
  return (
    <React.Suspense fallback={<Skeleton className="h-96" />}>
      <StressContent />
    </React.Suspense>
  );
}