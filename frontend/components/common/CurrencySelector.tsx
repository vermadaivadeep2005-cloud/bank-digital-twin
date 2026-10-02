"use client";

import React from "react";
import { DollarSign, Globe, ChevronDown, ArrowRightLeft } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { CurrencyCode, CURRENCIES } from "@/lib/format";

export function CurrencySelector() {
  const { currency, setCurrency, currencyConfig, openFxModal } = useCurrency();

  return (
    <div className="relative inline-flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-700">
        <span className="text-sm leading-none">{currencyConfig.flag}</span>
        <select
          value={currency}
          onChange={(e) => {
            const newCode = e.target.value as CurrencyCode;
            setCurrency(newCode);
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
          className="bg-transparent text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer pr-1"
        >
          {Object.values(CURRENCIES).map((c) => (
            <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100 font-sans py-1">
              {c.flag} {c.code} ({c.symbol}) — {c.name}
            </option>
          ))}
        </select>
        <span className="text-[10px] font-mono text-slate-400 border-l border-slate-700/60 pl-1.5">
          {currencyConfig.symbol}
        </span>
      </div>

      <button
        onClick={openFxModal}
        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-[11px] font-mono text-cyan-400 transition shadow-sm"
        title="Open Live & Historical FX Converter & Fee Audit"
      >
        <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">FX Rates & Fees</span>
      </button>
    </div>
  );
}
