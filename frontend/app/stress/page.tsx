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
import { runStressTest } from "@/lib/api";
import { StressTestPayload, StressTestResponse } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { downloadJson, printPdfReport } from "@/lib/exportUtils";

function StressContent() {
  const searchParams = useSearchParams();
  const presetUnemp = searchParams.get("unemp");
  const presetRate = searchParams.get("rate");
  const presetName = searchParams.get("name");

  const initialParams: Partial<StressTestPayload> = React.useMemo(() => ({
    scenario_name: presetName || "Custom Scenario",
    unemployment_shock: presetUnemp ? parseFloat(presetUnemp) : 0.05,
    rate_shock: presetRate ? parseFloat(presetRate) : 0.02,
  }), [presetName, presetUnemp, presetRate]);

  const [result, setResult] = React.useState<StressTestResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleRun = React.useCallback(async (payload: StressTestPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await runStressTest(payload);
      setResult(res);
      toast.success(`Simulation completed: ${res.survived_pct.toFixed(1)}% survival rate`);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : err instanceof Error ? err.message : "Simulation failed";
      setError(msg || "Simulation failed");
      toast.error(msg || "Simulation failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Run initial simulation on load
  React.useEffect(() => {
    let isMounted = true;
    runStressTest({
      scenario_name: initialParams.scenario_name || "Custom Scenario",
      unemployment_shock: initialParams.unemployment_shock ?? 0.05,
      rate_shock: initialParams.rate_shock ?? 0.02,
      n_sims: 1000,
      horizon_months: 24,
      seed: 42,
    })
      .then((res) => {
        if (isMounted) {
          setResult(res);
          toast.success(`Simulation completed: ${res.survived_pct.toFixed(1)}% survival rate`);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : err instanceof Error ? err.message : "Simulation failed";
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

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    toast.success("JSON results copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    if (!result) return;
    downloadJson(result, `stress_simulation_${Date.now()}.json`);
    toast.success("Downloaded simulation JSON report");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Stress Testing Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Macroeconomic shock trajectories over 24–60 months horizon
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportJson} disabled={!result}>
            <Download className="w-3.5 h-3.5" />
            <span>Export Report JSON</span>
          </Button>

          <Button variant="outline" size="sm" onClick={printPdfReport}>
            <Printer className="w-3.5 h-3.5" />
            <span>Download / Print PDF</span>
          </Button>

          {result && (
            <Button variant="outline" size="sm" onClick={handleCopyJson}>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Scenario Form */}
        <div className="lg:col-span-1">
          <ScenarioForm onSubmit={handleRun} loading={loading} initialParams={initialParams} />
          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <p className="font-semibold mb-1">Simulation Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Simulation Output Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {loading && (
            <Card className="space-y-4 p-8 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Running Vectorized Monte Carlo Simulation...</p>
              <p className="text-xs text-slate-400 font-mono">Evaluating PD/LGD risk functions across 1,000 macroeconomic shock paths</p>
              <Skeleton className="h-48 mt-4" />
            </Card>
          )}

          {!loading && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Top 4 Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
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

                <Card className="p-4">
                  <span className="text-[11px] font-mono text-slate-400 block uppercase">Expected Loss</span>
                  <div className="mt-1">
                    <span className="text-2xl font-bold font-mono text-indigo-400">
                      {formatCurrency(result.summary.expected_loss, true)}
                    </span>
                  </div>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] font-mono text-slate-400 block uppercase">P95 VaR Loss</span>
                  <div className="mt-1">
                    <span className="text-2xl font-bold font-mono text-amber-400">
                      {formatCurrency(result.summary.p95_loss, true)}
                    </span>
                  </div>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] font-mono text-slate-400 block uppercase">Worst Case</span>
                  <div className="mt-1">
                    <span className="text-2xl font-bold font-mono text-rose-400">
                      {formatCurrency(result.summary.worst_case_loss, true)}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Loss Distribution Histogram */}
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <CardTitle>Loss Distribution Severity</CardTitle>
                    <CardDescription>Histogram of total portfolio losses across Monte Carlo simulations</CardDescription>
                  </div>
                  <Badge variant="neutral">Frequency Distribution</Badge>
                </div>
                <LossHistogram losses={result.distribution} />
              </Card>

              {/* Capital Paths Fan Chart */}
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <CardTitle>Capital Path Trajectories (P5 / P50 / P95)</CardTitle>
                    <CardDescription>Projected bank Tier 1 capital over 24-month horizon under stress</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-emerald-400">P95 Best</span>
                    <span className="text-indigo-400">P50 Median</span>
                    <span className="text-rose-400">P5 Adverse</span>
                  </div>
                </div>
                <MonteCarloFan paths={result.capital_paths} />
              </Card>

              {/* Segment Breakdown */}
              {result.segment_breakdown && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <CardTitle className="text-sm">Impact by Loan Asset Class</CardTitle>
                    </div>
                    <SegmentBar data={result.segment_breakdown.by_type} title="Losses by Loan Type" />
                  </Card>

                  <Card>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-sky-400" />
                      <CardTitle className="text-sm">Regional Concentration Impact</CardTitle>
                    </div>
                    <SegmentBar data={result.segment_breakdown.by_region.slice(0, 5)} title="Losses by Top Regions" />
                  </Card>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
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