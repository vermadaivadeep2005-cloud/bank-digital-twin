"use client";

import * as React from "react";
import {
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MlRiskPredictor } from "@/components/ml/MlRiskPredictor";
import { getLoans } from "@/lib/api";
import { Loan, PaginatedResponse } from "@/types/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import { downloadJson, downloadCsv } from "@/lib/exportUtils";
import { toast } from "sonner";

export default function PortfolioPage() {
  const [data, setData] = React.useState<PaginatedResponse<Loan> | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Filter States
  const [page, setPage] = React.useState(1);
  const [loanType, setLoanType] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [region, setRegion] = React.useState("");

  const loadPortfolio = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLoans({
        page,
        size: 15,
        loan_type: loanType || undefined,
        status: status || undefined,
        region: region || undefined,
      });
      setData(res);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, loanType, status, region]);

  React.useEffect(() => {
    let isMounted = true;
    getLoans({
      page,
      size: 15,
      loan_type: loanType || undefined,
      status: status || undefined,
      region: region || undefined,
    })
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((e: unknown) => {
        if (isMounted) console.error(e);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [page, loanType, status, region]);

  const resetFilters = () => {
    setLoanType("");
    setStatus("");
    setRegion("");
    setPage(1);
  };

  const handleExportJson = () => {
    if (!data || !data.items) return;
    downloadJson(data.items, `loan_portfolio_${Date.now()}.json`);
    toast.success("Downloaded portfolio loans JSON");
  };

  const handleExportCsv = () => {
    if (!data || !data.items) return;
    const headers = ["Loan ID", "Customer ID", "Loan Type", "Principal ($)", "Outstanding ($)", "Interest Rate %", "Status", "Region"];
    const rows: (string | number)[][] = data.items.map((l) => [
      l.id,
      l.customer_id || "",
      l.loan_type,
      l.principal,
      l.outstanding,
      Number((l.interest_rate * 100).toFixed(2)),
      l.status,
      l.region,
    ]);
    downloadCsv(headers, rows, `loan_portfolio_${Date.now()}.csv`);
    toast.success("Downloaded portfolio loans CSV");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Loan Portfolio Explorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Financial ledger of synthetic loans across asset classes and geographic regions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleExportJson} disabled={!data || data.items.length === 0}>
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </Button>

          <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={!data || data.items.length === 0}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </Button>

          <Button size="sm" variant="outline" onClick={loadPortfolio} loading={loading}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Ledger</span>
          </Button>
        </div>
      </div>

      {/* ML Risk Predictor Calculator Widget */}
      <MlRiskPredictor />



      {/* Data Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="p-4">Asset Type</th>
                <th className="p-4 text-right">Principal</th>
                <th className="p-4 text-right">Outstanding</th>
                <th className="p-4 text-right">Interest Rate</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Region</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <Skeleton className="h-6" />
                    </td>
                  </tr>
                ))
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No loans match the selected filters.
                  </td>
                </tr>
              ) : (
                data.items.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 font-semibold text-slate-900 dark:text-white capitalize font-sans flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      {loan.loan_type}
                    </td>

                    <td className="p-4 text-right text-slate-300">
                      {formatCurrency(loan.principal)}
                    </td>

                    <td className="p-4 text-right text-indigo-300 font-bold">
                      {formatCurrency(loan.outstanding)}
                    </td>

                    <td className="p-4 text-right text-amber-300">
                      {formatPercent(loan.interest_rate * 100)}
                    </td>

                    <td className="p-4 text-center">
                      <Badge
                        variant={
                          loan.status === "current"
                            ? "success"
                            : loan.status === "delinquent"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {loan.status}
                      </Badge>
                    </td>

                    <td className="p-4 text-slate-400 font-sans">{loan.region}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Controls */}
        {data && (
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
            <span>
              Showing Page <strong className="text-white font-mono">{data.page}</strong> of{" "}
              <strong className="text-white font-mono">{data.pages}</strong> ({data.total} total loans)
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={data.page >= data.pages}
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}