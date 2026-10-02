"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Activity,
  CheckCircle2,
  Globe,
  Building2,
  Lock,
  ShieldAlert,
  Search,
  Filter,
  RotateCcw,
  Info,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  getComplianceReport,
  runComplianceStressCheck,
  ComplianceReportResponse,
  ComplianceMetricItem,
  FrameworkInfo,
} from "@/lib/api";

export default function CompliancePage() {
  const [report, setReport] = useState<ComplianceReportResponse | null>(null);
  const [stressCheck, setStressCheck] = useState<ComplianceMetricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningStress, setRunningStress] = useState(false);

  // Filters
  const [selectedFramework, setSelectedFramework] = useState<string>("all");
  const [selectedScope, setSelectedScope] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal / Detail state
  const [activeMetric, setActiveMetric] = useState<ComplianceMetricItem | null>(null);

  useEffect(() => {
    getComplianceReport()
      .then((data) => setReport(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRunStressCompliance = async () => {
    setRunningStress(true);
    try {
      const res = await runComplianceStressCheck({
        scenario_name: "Adverse Compliance Stress",
        unemployment_shock: 0.18,
        rate_shock: 0.04,
        n_sims: 500,
        horizon_months: 12,
      });
      setStressCheck(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningStress(false);
    }
  };

  const handlePrintPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const resetFilters = () => {
    setSelectedFramework("all");
    setSelectedScope("all");
    setSelectedStatus("all");
    setSearchQuery("");
  };

  // Filter logic
  const filteredMatrix = useMemo(() => {
    if (!report?.matrix) return [];
    return report.matrix.filter((item) => {
      // Framework filter
      if (selectedFramework !== "all" && item.framework_id !== selectedFramework) {
        return false;
      }
      // Scope filter
      if (selectedScope !== "all" && item.framework_type !== selectedScope) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesFramework = item.framework_name.toLowerCase().includes(query);
        const matchesClause = item.clause_reference?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesCategory && !matchesFramework && !matchesClause) {
          return false;
        }
      }
      return true;
    });
  }, [report, selectedFramework, selectedScope, selectedStatus, searchQuery]);

  // Compute framework badge styles
  const getFrameworkBadge = (fwId: string) => {
    switch (fwId) {
      case "rbi":
        return {
          label: "RBI Local Regulatory",
          bg: "bg-orange-500/10 text-orange-400 border-orange-500/30",
          icon: Building2,
        };
      case "basel":
        return {
          label: "Basel III/IV Accord",
          bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          icon: Globe,
        };
      case "swift":
        return {
          label: "SWIFT Banking",
          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
          icon: Lock,
        };
      case "fatf":
        return {
          label: "FATF AML/CFT",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: ShieldAlert,
        };
      case "frs102":
        return {
          label: "FRS 102 UK Standard",
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          icon: Scale,
        };
      default:
        return {
          label: fwId.toUpperCase(),
          bg: "bg-slate-800 text-slate-300 border-slate-700",
          icon: Scale,
        };
    }
  };

  const isFilterActive =
    selectedFramework !== "all" || selectedScope !== "all" || selectedStatus !== "all" || searchQuery.trim() !== "";

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto text-slate-100">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner">
            <Scale className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Multi-Framework Regulatory Compliance</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                Dynamic Audit
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Real-time balance sheet, liquidity, cyber security, and credit risk audit matrix across{" "}
              <strong className="text-orange-400 font-semibold">Local (RBI, FRS 102 UK)</strong> and{" "}
              <strong className="text-cyan-400 font-semibold">International (Basel III/IV, SWIFT, FATF)</strong> standards.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunStressCompliance}
            disabled={runningStress}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-50"
          >
            <Activity className={`h-4 w-4 ${runningStress ? "animate-spin text-cyan-400" : "text-cyan-400"}`} />
            <span>{runningStress ? "Simulating Crisis..." : "Run Post-Stress Audit"}</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-950/30 transition transform active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>Export Audit PDF</span>
          </button>
        </div>
      </div>

      {/* Dynamic Framework Summary Cards (Clickable quick filters) */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {report.frameworks.map((fw: FrameworkInfo) => {
            const badge = getFrameworkBadge(fw.id);
            const IconComp = badge.icon;
            const isSelected = selectedFramework === fw.id;
            const passPct = Math.round((fw.passed_count / fw.total_metrics) * 100);

            return (
              <div
                key={fw.id}
                onClick={() => setSelectedFramework(isSelected ? "all" : fw.id)}
                className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                  isSelected
                    ? "bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40"
                    : "bg-slate-900/80 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-lg border ${badge.bg}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">
                        {fw.type === "local" ? "🇮🇳 Local Regulatory" : "🌐 International"}
                      </span>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                        {fw.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <div className="text-2xl font-bold font-mono text-white">
                    {fw.passed_count}/{fw.total_metrics}
                    <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">passed</span>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      fw.status === "PASS"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : fw.status === "WARNING"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {fw.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950/80 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      fw.status === "PASS" ? "bg-emerald-400" : fw.status === "WARNING" ? "bg-amber-400" : "bg-rose-500"
                    }`}
                    style={{ width: `${passPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Pass Rate: {passPct}%</span>
                  {fw.warning_count > 0 && <span className="text-amber-400 font-semibold">{fw.warning_count} Warnings</span>}
                  {fw.failing_count > 0 && <span className="text-rose-400 font-semibold">{fw.failing_count} Breach</span>}
                  {fw.warning_count === 0 && fw.failing_count === 0 && (
                    <span className="text-emerald-400 font-semibold">Fully Compliant</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Filters & Controls Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <Filter className="h-4 w-4 text-amber-400" />
            <span>Interactive Framework & Metric Filters</span>
            {isFilterActive && (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Filtered: {filteredMatrix.length} of {report?.total_metrics || 0} metrics
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            <div className="relative min-w-[240px]">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search metrics, clause, or framework..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/50 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
              />
            </div>

            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Framework Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-1">
            <button
              onClick={() => setSelectedFramework("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedFramework === "all"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              All Frameworks
            </button>
            <button
              onClick={() => setSelectedFramework("rbi")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedFramework === "rbi"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-orange-400" />
              <span>RBI Regulatory</span>
            </button>
            <button
              onClick={() => setSelectedFramework("basel")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedFramework === "basel"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span>Basel III/IV</span>
            </button>
            <button
              onClick={() => setSelectedFramework("swift")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedFramework === "swift"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
              <span>SWIFT Banking</span>
            </button>
            <button
              onClick={() => setSelectedFramework("fatf")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedFramework === "fatf"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
              <span>FATF Standards</span>
            </button>
            <button
              onClick={() => setSelectedFramework("frs102")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedFramework === "frs102"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Scale className="h-3.5 w-3.5 text-purple-400" />
              <span>FRS 102 UK</span>
            </button>
          </div>

          {/* Scope Dropdown / Chips */}
          <div className="flex items-center space-x-1 bg-slate-950/70 border border-slate-800/80 rounded-xl p-1">
            <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase">Scope:</span>
            <button
              onClick={() => setSelectedScope("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedScope === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedScope("local")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedScope === "local"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇮🇳 Local Regulatory
            </button>
            <button
              onClick={() => setSelectedScope("international")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedScope === "international"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🌐 International
            </button>
          </div>

          {/* Status Chips */}
          <div className="flex items-center space-x-1 bg-slate-950/70 border border-slate-800/80 rounded-xl p-1">
            <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase">Status:</span>
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedStatus === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus("pass")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedStatus === "pass"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🟢 Pass
            </button>
            <button
              onClick={() => setSelectedStatus("warning")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedStatus === "warning"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🟡 Warning
            </button>
            <button
              onClick={() => setSelectedStatus("fail")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedStatus === "fail"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🔴 Breach
            </button>
          </div>
        </div>
      </div>

      {/* Main Multi-Framework Compliance Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              <span>Multi-Framework Compliance Matrix</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredMatrix.length} regulatory compliance checks evaluated against live bank capital & operational parameters
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            Audit Timestamp: {report?.generated_at || "Just now"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Regulatory Metric & Clause</th>
                <th className="px-6 py-4">Framework</th>
                <th className="px-6 py-4">Scope</th>
                <th className="px-6 py-4">Actual Value</th>
                <th className="px-6 py-4">Target / Limit</th>
                <th className="px-6 py-4">Req Buffer</th>
                <th className="px-6 py-4 text-center">Traffic Light Status</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 font-sans">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No regulatory metrics matched your current filter selection.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((item) => {
                  const fwBadge = getFrameworkBadge(item.framework_id);
                  const IconComp = fwBadge.icon;

                  return (
                    <tr
                      key={item.metric_key}
                      onClick={() => setActiveMetric(item)}
                      className="hover:bg-slate-800/50 cursor-pointer transition group"
                    >
                      <td className="px-6 py-4 font-sans">
                        <div className="font-bold text-white group-hover:text-amber-400 transition">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.category}
                          </span>
                          {item.clause_reference && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80 font-mono">
                              📜 {item.clause_reference}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-sans">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${fwBadge.bg}`}>
                          <IconComp className="h-3 w-3" />
                          <span>{item.framework_name}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 font-sans">
                        {item.framework_type === "local" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            🇮🇳 Local
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            🌐 International
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-bold text-white text-base">
                        {item.value}
                        <span className="text-xs text-slate-400 font-normal ml-0.5">{item.unit}</span>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {item.is_max_threshold ? "≤ " : "≥ "}
                        {item.minimum}
                        <span className="text-xs text-slate-500 ml-0.5">{item.unit}</span>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        +{item.buffer}
                        <span className="text-xs text-slate-500 ml-0.5">{item.unit}</span>
                      </td>

                      <td className="px-6 py-4 text-center font-sans">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            item.status === "pass"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                              : item.status === "warning"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/10"
                          }`}
                        >
                          {item.status === "pass" ? "🟢 PASS" : item.status === "warning" ? "🟡 WARN" : "🔴 FAIL"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMetric(item);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post-Stress Compliance Shift Audit (Simulated Crisis Scenario) */}
      {stressCheck.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <span>Post-Stress Multi-Framework Compliance Shift (Simulated Macro Crisis)</span>
            </h2>
            <span className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
              Shock: Unemployment +18%, Rate +4%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stressCheck.map((item) => {
              const badge = getFrameworkBadge(item.framework_id);
              return (
                <div
                  key={item.metric_key}
                  className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${badge.bg}`}>
                      {item.framework_name}
                    </span>
                    <div className="text-sm font-bold text-white line-clamp-1">{item.name}</div>
                    <div className="text-xs text-slate-500">
                      Req Target: {item.minimum}{item.unit}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-cyan-400">
                      {item.value}{item.unit}
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.status === "pass"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : item.status === "warning"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metric Detail Modal / Expandable Drawer */}
      {activeMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {activeMetric.framework_name} ({activeMetric.framework_type === "local" ? "Local Regulatory" : "International Framework"})
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{activeMetric.name}</h3>
              </div>
              <button
                onClick={() => setActiveMetric(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-sm">
              <div>
                <div className="text-xs text-slate-500 font-sans">Current Evaluated Value</div>
                <div className="text-2xl font-bold text-white mt-0.5">
                  {activeMetric.value}
                  {activeMetric.unit}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-sans">
                  Regulatory {activeMetric.is_max_threshold ? "Maximum Limit" : "Minimum Requirement"}
                </div>
                <div className="text-2xl font-bold text-amber-400 mt-0.5">
                  {activeMetric.minimum}
                  {activeMetric.unit}
                </div>
              </div>
            </div>

            <div className="space-y-3 font-sans text-sm text-slate-300">
              {activeMetric.clause_reference && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Regulation Clause Reference</div>
                  <div className="mt-1 text-slate-200 font-mono text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    📜 {activeMetric.clause_reference}
                  </div>
                </div>
              )}

              {activeMetric.description && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Regulatory Purpose & Scope</div>
                  <p className="mt-1 text-slate-300 text-xs leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                    {activeMetric.description}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Severity Rating: <strong className="text-slate-300 uppercase">{activeMetric.severity}</strong>
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                    activeMetric.status === "pass"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : activeMetric.status === "warning"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  Status: {activeMetric.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveMetric(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Close Audit Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
