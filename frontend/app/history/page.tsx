"use client";

import * as React from "react";
import { Eye, Trash2, RefreshCw, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { getStressRuns, deleteStressRun } from "@/lib/api";
import { StressRunOut } from "@/types/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadJson, downloadCsv } from "@/lib/exportUtils";

export default function HistoryPage() {
  const [runs, setRuns] = React.useState<StressRunOut[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRun, setSelectedRun] = React.useState<StressRunOut | null>(null);

  const loadRuns = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStressRuns();
      setRuns(data);
    } catch {
      toast.error("Failed to load stress run history");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    getStressRuns()
      .then((data) => {
        if (isMounted) setRuns(data);
      })
      .catch(() => {
        if (isMounted) toast.error("Failed to load stress run history");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteStressRun(id);
      toast.success("Stress run record deleted");
      setRuns((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to delete stress run");
    }
  };

  const handleExportJson = () => {
    downloadJson(runs, `stress_audit_history_${Date.now()}.json`);
    toast.success("Downloaded audit history JSON");
  };

  const handleExportCsv = () => {
    const headers = ["ID", "Scenario Name", "Unemployment Shock", "Rate Shock", "Survival Rate %", "Expected Loss ($)", "Timestamp"];
    const rows = runs.map((r) => [
      r.id,
      r.scenario_name,
      `${((r.params?.unemployment_shock ?? 0) * 100).toFixed(1)}%`,
      `${((r.params?.rate_shock ?? 0) * 100).toFixed(1)}%`,
      `${(r.results?.survived_pct ?? 100).toFixed(1)}%`,
      r.results?.summary?.expected_loss ?? 0,
      r.created_at || "",
    ]);
    downloadCsv(headers, rows, `stress_audit_history_${Date.now()}.csv`);
    toast.success("Downloaded audit history CSV");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Stress Test Audit History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Execution logs of Monte Carlo stress tests performed on this digital twin
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleExportJson} disabled={runs.length === 0}>
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </Button>

          <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={runs.length === 0}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </Button>

          <Button size="sm" variant="outline" onClick={loadRuns} loading={loading}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Audit Logs</span>
          </Button>
        </div>
      </div>

      {/* History Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="p-4">Scenario Title</th>
                <th className="p-4">Shock Parameters</th>
                <th className="p-4 text-center">Survival Rate</th>
                <th className="p-4 text-right">Expected Loss</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <Skeleton className="h-6" />
                    </td>
                  </tr>
                ))
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No stress test runs recorded yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => setSelectedRun(run)}
                    className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-semibold text-slate-900 dark:text-white font-sans">{run.scenario_name}</td>

                    <td className="p-4 text-slate-300">
                      Unemp: +{(run.params.unemployment_shock * 100).toFixed(1)} pp | Rate: {(run.params.rate_shock * 100).toFixed(1)} pp
                    </td>

                    <td className="p-4 text-center">
                      <Badge
                        variant={
                          run.results.survived_pct >= 95
                            ? "success"
                            : run.results.survived_pct >= 80
                            ? "warning"
                            : "danger"
                        }
                      >
                        {run.results.survived_pct.toFixed(1)}%
                      </Badge>
                    </td>

                    <td className="p-4 text-right text-indigo-300 font-bold">
                      {formatCurrency(run.results.summary.expected_loss, true)}
                    </td>

                    <td className="p-4 text-slate-400 font-sans">{formatDate(run.created_at)}</td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRun(run);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          onClick={(e) => handleDelete(run.id, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={selectedRun !== null}
        onClose={() => setSelectedRun(null)}
        title={selectedRun?.scenario_name || "Run Detail"}
      >
        {selectedRun && (
          <div className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Unemployment Shock</span>
                <span className="text-rose-400 font-bold text-sm">
                  +{(selectedRun.params.unemployment_shock * 100).toFixed(1)} pp
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Interest Rate Shock</span>
                <span className="text-amber-400 font-bold text-sm">
                  {(selectedRun.params.rate_shock * 100).toFixed(1)} pp
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Expected Loss</span>
                <span className="text-indigo-300 font-bold text-sm">
                  {formatCurrency(selectedRun.results.summary.expected_loss)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Worst Case Loss</span>
                <span className="text-rose-400 font-bold text-sm">
                  {formatCurrency(selectedRun.results.summary.worst_case_loss)}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              Run ID: <code className="text-slate-200">{selectedRun.id}</code>
              <br />
              Timestamp: <span>{formatDate(selectedRun.created_at)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
