"use client";

import { useState, useEffect } from "react";
import { Scale, ShieldCheck, AlertTriangle, AlertOctagon, Printer, Activity, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { getComplianceReport, getComplianceGaps, runComplianceStressCheck } from "@/lib/api";

interface MetricItem {
  metric_key: string;
  name: string;
  category: string;
  value: number;
  minimum: number;
  buffer: number;
  status: string;
  severity: string;
  unit: string;
}

export default function CompliancePage() {
  const [report, setReport] = useState<any>(null);
  const [stressCheck, setStressCheck] = useState<MetricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningStress, setRunningStress] = useState(false);

  useEffect(() => {
    getComplianceReport()
      .then((data) => {
        setReport(data);
      })
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

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Regulatory Compliance Dashboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Basel III, CCAR, & DFAST Capital Adequacy Matrix & Solvency Audit
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunStressCompliance}
            disabled={runningStress}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            <Activity className={`h-4 w-4 ${runningStress ? "animate-spin text-cyan-400" : ""}`} />
            <span>Post-Stress Check</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-lg shadow-amber-950/20 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Export Compliance PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Status</span>
            <div className="mt-2 flex items-center space-x-2">
              {report.overall_status === "PASS" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              )}
              <span className={`text-xl font-bold font-mono ${report.overall_status === "PASS" ? "text-emerald-400" : "text-amber-400"}`}>
                {report.overall_status}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passed Checks</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-2">{report.passed_count}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Warning Buffer</span>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-2">{report.warning_count}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Regulatory Breaches</span>
            <div className="text-2xl font-bold text-rose-400 font-mono mt-2">{report.failing_count}</div>
          </div>
        </div>
      )}

      {/* Main Compliance Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">Basel III & Regulatory Capital Matrix</h2>
          <span className="text-xs text-slate-500 font-mono">Last Evaluated: {report?.generated_at || "Just now"}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Regulatory Metric</th>
                <th className="px-6 py-4">Framework</th>
                <th className="px-6 py-4">Actual Value</th>
                <th className="px-6 py-4">Reg Minimum</th>
                <th className="px-6 py-4">Required Buffer</th>
                <th className="px-6 py-4 text-center">Traffic Light Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
              {report?.matrix.map((item: MetricItem) => (
                <tr key={item.metric_key} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-sans font-semibold text-white">{item.name}</td>
                  <td className="px-6 py-4 text-xs font-sans text-slate-400">{item.category}</td>
                  <td className="px-6 py-4 font-bold text-white">
                    {item.value}
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {item.minimum}
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    +{item.buffer}
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wide ${
                        item.status === "pass"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : item.status === "warning"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {item.status === "pass" ? "🟢 PASS" : item.status === "warning" ? "🟡 WARN" : "🔴 FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post-Stress Compliance Check Results */}
      {stressCheck.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <span>Post-Stress Compliance Shift (Simulated Adverse Crisis)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stressCheck.map((item) => (
              <div key={item.metric_key} className="bg-slate-950/60 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-slate-500">Reg Min: {item.minimum}{item.unit}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-cyan-400">{item.value}{item.unit}</div>
                  <span className={`text-xs font-bold ${item.status === "pass" ? "text-emerald-400" : "text-rose-400"}`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
