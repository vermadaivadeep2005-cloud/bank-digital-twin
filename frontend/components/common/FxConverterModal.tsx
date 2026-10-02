"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import {
  ArrowRightLeft,
  Calendar,
  DollarSign,
  Percent,
  RefreshCw,
  Globe,
  Sparkles,
  Info,
  Building,
  CheckCircle2,
} from "lucide-react";
import { CurrencyCode, CURRENCIES } from "@/lib/format";
import { convertFxAmount, FxConvertResponse } from "@/lib/api";
import { toast } from "sonner";

interface FxConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FxConverterModal({ isOpen, onClose }: FxConverterModalProps) {
  const [amount, setAmount] = useState<number>(100000);
  const [fromCurr, setFromCurr] = useState<CurrencyCode>("USD");
  const [toCurr, setToCurr] = useState<CurrencyCode>("INR");
  const [dateOption, setDateOption] = useState<"latest" | "1year" | "2years" | "custom">("latest");
  const [customDate, setCustomDate] = useState<string>("2024-10-02");
  const [feePercent, setFeePercent] = useState<number>(0.25);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<FxConvertResponse | null>(null);

  // Quick fee presets
  const FEE_PRESETS = [
    { label: "0.10% (Institutional)", val: 0.1 },
    { label: "0.25% (Standard)", val: 0.25 },
    { label: "0.50% (Commercial)", val: 0.5 },
    { label: "1.00% (Retail)", val: 1.0 },
  ];

  const getTargetDate = (): string | undefined => {
    if (dateOption === "latest") return undefined;
    if (dateOption === "1year") {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().split("T")[0];
    }
    if (dateOption === "2years") {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 2);
      return d.toISOString().split("T")[0];
    }
    return customDate;
  };

  const handleConvert = async () => {
    if (amount <= 0) return;
    setLoading(true);
    try {
      const targetDate = getTargetDate();
      const data = await convertFxAmount({
        amount,
        from_currency: fromCurr,
        to_currency: toCurr,
        date: targetDate,
        fee_percent: feePercent,
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to fetch exchange rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleConvert();
    }
  }, [isOpen, fromCurr, toCurr, dateOption, customDate, feePercent]);

  const handleSwap = () => {
    const temp = fromCurr;
    setFromCurr(toCurr);
    setToCurr(temp);
  };

  const fromCfg = CURRENCIES[fromCurr] || CURRENCIES.USD;
  const toCfg = CURRENCIES[toCurr] || CURRENCIES.INR;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live & Historical FX Converter & Fee Audit">
      <div className="space-y-5 text-slate-100 font-sans">
        {/* API Data Source Banner */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-xl text-xs">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>
              API Source: <strong className="text-cyan-300">European Central Bank (Frankfurter API)</strong>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono uppercase font-bold">
            Real Live & Historical
          </span>
        </div>

        {/* Historical Date Preset Tabs */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Exchange Rate Date Selection:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setDateOption("latest")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border ${
                dateOption === "latest"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Today</span>
            </button>
            <button
              type="button"
              onClick={() => setDateOption("1year")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border ${
                dateOption === "1year"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>1 Year Ago</span>
            </button>
            <button
              type="button"
              onClick={() => setDateOption("2years")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border ${
                dateOption === "2years"
                  ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>2 Years Ago</span>
            </button>
            <button
              type="button"
              onClick={() => setDateOption("custom")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border ${
                dateOption === "custom"
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-md shadow-purple-500/10"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Custom Date</span>
            </button>
          </div>

          {dateOption === "custom" && (
            <div className="mt-2.5 flex items-center space-x-2">
              <span className="text-xs text-slate-400">Pick Historical Date:</span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
              />
            </div>
          )}
        </div>

        {/* Currency & Amount Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
          <div className="sm:col-span-5">
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Source Amount</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-indigo-500">
              <span className="text-xs font-bold font-mono text-indigo-400">{fromCfg.symbol}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                placeholder="100000"
              />
              <select
                value={fromCurr}
                onChange={(e) => setFromCurr(e.target.value as CurrencyCode)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-200 cursor-pointer outline-none"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-center pt-2 sm:pt-4">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 hover:text-white"
              title="Swap currencies"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="sm:col-span-5">
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Target Currency</label>
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5">
              <span className="text-sm font-bold font-mono text-slate-300">{toCfg.name}</span>
              <select
                value={toCurr}
                onChange={(e) => setToCurr(e.target.value as CurrencyCode)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-200 cursor-pointer outline-none"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic FX Conversion Fee Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Percent className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Dynamic FX Conversion Fee (Spread):</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {feePercent.toFixed(2)}%
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {FEE_PRESETS.map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => setFeePercent(p.val)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                  feePercent === p.val
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Calculation Results Card */}
        {loading ? (
          <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Fetching live ECB rates from Frankfurter API...</p>
          </div>
        ) : result ? (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                  Net Converted Amount ({result.is_historical ? `Date: ${result.date_used}` : "Live Real-Time Rate"})
                </div>
                <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                  {toCfg.symbol}
                  {result.conversion.net_converted_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  <span className="text-sm text-slate-400 font-sans ml-2">{toCurr}</span>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-[11px] text-slate-400">Mid-Market Rate</div>
                <div className="text-sm font-bold text-amber-400">
                  1 {fromCurr} = {result.conversion.mid_market_rate} {toCurr}
                </div>
              </div>
            </div>

            {/* Breakdown Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-sans">Gross Converted</div>
                <div className="text-slate-200 font-bold mt-0.5">
                  {toCfg.symbol}{result.conversion.gross_converted_amount.toLocaleString("en-US")}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-amber-500/20">
                <div className="text-[10px] text-amber-400/80 font-sans">FX Conversion Fee ({feePercent}%)</div>
                <div className="text-amber-400 font-bold mt-0.5">
                  -{toCfg.symbol}{result.conversion.conversion_fee_amount.toLocaleString("en-US")}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-sans">Effective Rate</div>
                <div className="text-cyan-400 font-bold mt-0.5">
                  {result.conversion.effective_exchange_rate.toFixed(4)}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-sans">Provider Status</div>
                <div className="text-emerald-400 font-semibold flex items-center space-x-1 mt-0.5 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="truncate">ECB Verified</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Close Converter
          </button>
        </div>
      </div>
    </Modal>
  );
}
