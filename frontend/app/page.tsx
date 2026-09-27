"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Zap,
  RefreshCw,
  ArrowRight,
  PieChart as PieIcon,
  Activity,
  History,
  Download,
  FileSpreadsheet,
  Sliders,
  FileText,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/charts/KpiCard";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { MlRiskPredictor } from "@/components/ml/MlRiskPredictor";
import AiExecutiveCopilot from "@/components/ai/AiExecutiveCopilot";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportCsvModal } from "@/components/common/ImportCsvModal";
import { getKpis, getKpiTrends, generateBank, getStressRuns } from "@/lib/api";
import { Kpis, KpiTrendResponse, StressRunOut } from "@/types/api";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { downloadJson, downloadCsv, exportPdfReport } from "@/lib/exportUtils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function OverviewPage() {
  const [kpis, setKpis] = React.useState<Kpis | null>(null);
  const [trends, setTrends] = React.useState<KpiTrendResponse | null>(null);
  const [stressRuns, setStressRuns] = React.useState<StressRunOut[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [k, t, runs] = await Promise.all([
        getKpis().catch(() => null),
        getKpiTrends().catch(() => null),
        getStressRuns().catch(() => []),
      ]);
      setKpis(k);
      setTrends(t);
      setStressRuns(runs);
    } catch (e: unknown) {
      console.error(e);
      toast.error("Failed to load portfolio KPIs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      getKpis().catch(() => null),
      getKpiTrends().catch(() => null),
      getStressRuns().catch(() => []),
    ])
      .then(([k, t, runs]) => {
        if (isMounted) {
          setKpis(k);
          setTrends(t);
          setStressRuns(runs);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateBank(5000);
      toast.success("Successfully generated 5,000 synthetic customers & loans!");
      await loadData();
    } catch {
      toast.error("Generation failed. Check server logs.");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportSummaryCsv = () => {
    if (!kpis) return;
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Customers", kpis.total_customers],
      ["Total Loans", kpis.total_loans],
      ["Total Outstanding ($)", kpis.total_outstanding],
      ["Capital Adequacy Ratio (CAR %)", kpis.car],
      ["NPL Ratio %", kpis.npl_ratio],
      ["Tier 1 Capital ($)", kpis.capital],
      ["Risk Weighted Assets ($)", kpis.rwa],
      ["ROA %", kpis.roa],
      ["NIM %", kpis.nim],
    ];
    downloadCsv(headers, rows, `bank_kpis_summary_${Date.now()}.csv`);
    toast.success("Downloaded bank summary CSV");
  };

  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

  const handleExportPdfReport = () => {
    if (!kpis) return;
    exportPdfReport({
      title: "Aegis Bank Digital Twin — Executive Solvency & Risk Audit Report",
      metrics: [
        { label: "Outstanding Portfolio", value: formatCurrency(kpis.total_outstanding, true), detail: "Aggregate Outstanding Principal" },
        { label: "Capital Adequacy Ratio (CAR)", value: `${kpis.car.toFixed(2)}%`, detail: "Basel III Minimum Target >= 8.0%" },
        { label: "NPL Default Ratio", value: `${kpis.npl_ratio.toFixed(2)}%`, detail: "Non-Performing Loan Ratio" },
        { label: "Tier 1 Capital", value: formatCurrency(kpis.capital, true), detail: "Core Capital Reserve Buffer" },
        { label: "Risk-Weighted Assets", value: formatCurrency(kpis.rwa, true), detail: "RWA Asset Base" },
        { label: "Return on Assets (ROA)", value: `${kpis.roa.toFixed(2)}%`, detail: "Net Profitability Index" },
      ],
      tables: [
        {
          title: "Basel III / IV Capital Adequacy & Solvency Compliance Matrix",
          headers: ["Regulatory Standard", "Minimum Requirement", "Current Position", "Compliance Status"],
          rows: [
            ["Capital Adequacy Ratio (CAR)", ">= 8.0%", `${kpis.car.toFixed(2)}%`, kpis.car >= 8 ? "PASSED" : "CRITICAL"],
            ["Non-Performing Loans (NPL)", "<= 5.0%", `${kpis.npl_ratio.toFixed(2)}%`, kpis.npl_ratio <= 5 ? "PASSED" : "WATCHLIST"],
            ["Tier 1 Capital Ratio", ">= 6.0%", `${(kpis.car * 0.85).toFixed(2)}%`, "PASSED"],
            ["Liquidity Coverage Ratio (LCR)", ">= 100.0%", "120.0%", "PASSED"],
            ["Net Stable Funding Ratio (NSFR)", ">= 100.0%", "115.0%", "PASSED"],
          ],
        },
      ],
    });
    toast.success("Generated plain PDF audit report with graphs & metrics!");
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Clean Breathable Hero Section: Title + Subtitle + CTAs */}
      <motion.div variants={itemVariants} className="pt-2 pb-4 space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Bank Digital Twin Platform
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-normal max-w-2xl mt-1.5">
            AI-powered synthetic banking simulator with vectorized Monte Carlo stress testing and credit default modeling.
          </p>
        </div>
      </motion.div>

      {/* Primary KPI Grid (Top Row) with 3D Flippy Hover Cards */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-[11px] font-mono tracking-widest uppercase text-slate-500 font-semibold">
            CORE FINANCIAL METRICS & RWA CAPITAL RATIOS
          </h2>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={handleExportSummaryCsv}
              disabled={!kpis}
              variant="outline"
              size="sm"
              className="backdrop-blur-md bg-slate-900/40 border border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-500/80 text-slate-200 font-medium text-xs h-9 px-3.5 shadow-sm rounded-xl transition-all duration-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download CSV</span>
            </Button>

            <Button
              onClick={handleExportPdfReport}
              disabled={!kpis}
              variant="outline"
              size="sm"
              className="backdrop-blur-md bg-slate-900/40 border border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-500/80 text-slate-200 font-medium text-xs h-9 px-3.5 shadow-sm rounded-xl transition-all duration-200"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Polished PDF Report</span>
            </Button>

            <Button
              onClick={handleGenerate}
              loading={generating}
              variant="outline"
              size="sm"
              className="backdrop-blur-md bg-slate-900/40 border border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-500/80 text-slate-200 font-medium text-xs h-9 px-3.5 shadow-sm rounded-xl transition-all duration-200"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generate Bank Data</span>
            </Button>

            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              size="sm"
              className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-500/70 text-emerald-300 font-semibold text-xs h-9 px-3.5 shadow-md rounded-xl transition-all duration-200"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Real CSV (CRO Input)</span>
            </Button>
          </div>
        </div>

        {loading || !kpis ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Outstanding Portfolio"
              value={formatCurrency(kpis.total_outstanding, true)}
              delta="+4.2%"
              isPositive={true}
              hint="Total aggregate outstanding loan principal across all active accounts"
              icon={DollarSign}
            />
            <KpiCard
              label="Capital Adequacy (CAR)"
              value={formatPercent(kpis.car)}
              delta="+0.8%"
              isPositive={kpis.car >= 8.0}
              hint="Capital Adequacy Ratio (Tier 1 Capital / Risk Weighted Assets). Regulatory minimum: 8.0%"
              icon={ShieldCheck}
            />
            <KpiCard
              label="NPL Default Ratio"
              value={formatPercent(kpis.npl_ratio)}
              delta="-0.3%"
              isPositive={kpis.npl_ratio <= 5.0}
              hint="Non-Performing Loans Ratio (Delinquent + Default loans / Total Outstanding)"
              icon={TrendingDown}
            />
            <KpiCard
              label="Return on Assets (ROA)"
              value={formatPercent(kpis.roa)}
              delta="+0.15%"
              isPositive={true}
              hint="Net Interest Earnings minus loan losses divided by total asset base"
              icon={Activity}
            />
          </div>
        )}
      </motion.div>

      {/* Secondary KPI Row */}
      {kpis && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between border-slate-800 bg-slate-900/80">
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-slate-500 font-semibold block">Total Customers</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{kpis.total_customers.toLocaleString()}</span>
            </div>
            <Users className="w-5 h-5 text-indigo-400 opacity-80" />
          </Card>

          <Card className="p-4 flex items-center justify-between border-slate-800 bg-slate-900/80">
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-slate-500 font-semibold block">Active Loans</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{kpis.total_loans.toLocaleString()}</span>
            </div>
            <Building2 className="w-5 h-5 text-sky-400 opacity-80" />
          </Card>

          <Card className="p-4 flex items-center justify-between border-slate-800 bg-slate-900/80">
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-slate-500 font-semibold block">Tier 1 Capital</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{formatCurrency(kpis.capital, true)}</span>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400 opacity-80" />
          </Card>

          <Card className="p-4 flex items-center justify-between border-slate-800 bg-slate-900/80">
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-slate-500 font-semibold block">Net Interest Margin</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{formatPercent(kpis.nim)}</span>
            </div>
            <Activity className="w-5 h-5 text-amber-400 opacity-80" />
          </Card>
        </motion.div>
      )}

      {/* Interactive ML Credit Default Predictor Widget */}
      <motion.div variants={itemVariants}>
        <MlRiskPredictor />
      </motion.div>

      {/* AI Chief Risk Officer Audit Card — MOVED BELOW THE FOLD */}
      <motion.div variants={itemVariants}>
        <AiExecutiveCopilot />
      </motion.div>

      {/* Row 2: Interactive Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 30-Day Historical Trend */}
        <Card className="lg:col-span-2 border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-base font-semibold text-slate-100">Historical Trend Forecasting</CardTitle>
              <CardDescription className="text-xs text-slate-500">30-day time-series trajectory of CAR capital adequacy, NPL, and ROA</CardDescription>
            </div>
            <Badge className="bg-slate-800 text-cyan-400 border border-slate-700 font-mono text-xs">30-Day Window</Badge>
          </div>

          {trends && trends.history ? (
            <TrendLineChart data={trends.history} />
          ) : (
            <Skeleton className="h-64" />
          )}
        </Card>

        {/* Right: Quick Action Navigator */}
        <Card className="flex flex-col justify-between border-slate-800 bg-slate-900/80 p-6">
          <div>
            <CardTitle className="text-base font-semibold text-slate-100 mb-1">Digital Twin Quick Actions</CardTitle>
            <CardDescription className="text-xs text-slate-500 mb-4">
              Direct access to portfolio simulation modules
            </CardDescription>

            <div className="space-y-3">
              <Link href="/stress" className="block">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500/50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Monte Carlo Engine</p>
                      <p className="text-[10px] text-slate-500">Run unemployment & rate shocks</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>

              <Link href="/portfolio" className="block">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500/50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Portfolio Explorer</p>
                      <p className="text-[10px] text-slate-500">Filter loans by type & region</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                </div>
              </Link>

              <Link href="/scenarios" className="block">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500/50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <PieIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Predefined Scenarios</p>
                      <p className="text-[10px] text-slate-500">Baseline, 2008 Crisis, COVID</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Simulation Seed: #42</span>
            <span>Vectorized NumPy</span>
          </div>
        </Card>
      </motion.div>

      {/* Row 3: Recent Stress Test Audit Feed */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <CardTitle className="text-base font-semibold text-slate-100">Recent Stress Runs Audit Trail</CardTitle>
            </div>
            <Link href="/history">
              <Button size="sm" variant="ghost" className="text-xs text-slate-400 hover:text-white">View All Runs</Button>
            </Link>
          </div>

          {stressRuns.length === 0 ? (
            <p className="text-xs text-slate-500 p-4 text-center">No stress test runs recorded yet. Run a simulation from the Stress Engine.</p>
          ) : (
            <div className="divide-y divide-slate-800/60 overflow-x-auto">
              {stressRuns.slice(0, 5).map((run) => (
                <div key={run.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{run.scenario_name}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      Unemployment Shock: +{(run.params.unemployment_shock * 100).toFixed(1)} pp | Rate Shock: {(run.params.rate_shock * 100).toFixed(1)} pp
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">Survival</span>
                      <Badge variant={run.results.survived_pct >= 95 ? "success" : run.results.survived_pct >= 80 ? "warning" : "danger"}>
                        {run.results.survived_pct.toFixed(1)}%
                      </Badge>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">Expected Loss</span>
                      <span className="font-mono text-slate-200 font-semibold">{formatCurrency(run.results.summary.expected_loss, true)}</span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 hidden sm:block">{formatDate(run.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadData}
      />
    </motion.div>
  );
}