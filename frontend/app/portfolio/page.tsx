"use client";

import * as React from "react";
import {
  Filter,
  Search,
  X,
  RotateCcw,
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
  const [searchQuery, setSearchQuery] = React.useState("");

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
    setSearchQuery("");
    setPage(1);
  };

  const filteredItems = React.useMemo(() => {
    if (!data || !data.items) return [];
    if (!searchQuery.trim()) return data.items;
    const q = searchQuery.toLowerCase().trim();
    return data.items.filter(
      (l) =>
        l.id.toLowerCase().includes(q) ||
        (l.customer_id && l.customer_id.toLowerCase().includes(q)) ||
        l.loan_type.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const handleExportJson = () => {
    if (!data || !data.items) return;
    downloadJson(filteredItems, `loan_portfolio_${Date.now()}.json`);
    toast.success("Downloaded portfolio loans JSON");
  };

  const handleExportCsv = () => {
    if (!data || !data.items) return;
    const headers = ["Loan ID", "Customer ID", "Loan Type", "Principal ($)", "Outstanding ($)", "Interest Rate %", "Status", "Region"];
    const rows: (string | number)[][] = filteredItems.map((l) => [
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

      {/* Interactive Filter Toolbar Card */}
      <Card className="p-4 bg-slate-900/90 border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono uppercase font-semibold mr-1">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Filters:</span>
            </div>

            {/* Loan Type Dropdown */}
            <select
              value={loanType}
              onChange={(e) => {
                setLoanType(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
            >
              <option value="">All Loan Types</option>
              <option value="mortgage">Mortgage</option>
              <option value="personal">Personal</option>
              <option value="auto">Auto</option>
              <option value="business">Business</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
            >
              <option value="">All Statuses</option>
              <option value="current">Current</option>
              <option value="delinquent">Delinquent</option>
              <option value="default">Default</option>
            </select>

            {/* Region Dropdown */}
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
            >
              <option value="">All Regions</option>
              <option value="CA">California (CA)</option>
              <option value="NY">New York (NY)</option>
              <option value="TX">Texas (TX)</option>
              <option value="FL">Florida (FL)</option>
              <option value="IL">Illinois (IL)</option>
              <option value="MA">Massachusetts (MA)</option>
              <option value="WA">Washington (WA)</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Loan / Region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-44 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Reset Button */}
            {(loanType || status || region || searchQuery) && (
              <Button size="sm" variant="ghost" onClick={resetFilters} className="text-slate-400 hover:text-white text-xs gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>

          {/* Matches Count Badge */}
          {data && (
            <div className="text-[11px] font-mono text-slate-400">
              Showing <span className="text-indigo-400 font-bold">{filteredItems.length}</span> of {data.total} loans
            </div>
          )}
        </div>
      </Card>

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
              ) : !data || filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans space-y-2">
                    <p>No loans match the selected filters.</p>
                    <Button size="sm" variant="outline" onClick={resetFilters} className="mt-2 text-xs">
                      Reset Filters
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((loan) => (
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