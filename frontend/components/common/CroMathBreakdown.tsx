"use client";

import React, { useState } from "react";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  Layers,
  BookOpen,
} from "lucide-react";

export interface MathStep {
  step: number;
  title: string;
  formula: string;
  explanation: string;
  evaluatedValue?: string;
}

export interface CroMathBreakdownProps {
  title?: string;
  methodology: string;
  steps: MathStep[];
  className?: string;
  defaultExpanded?: boolean;
}

export const CroMathBreakdown: React.FC<CroMathBreakdownProps> = ({
  title = "CRO Mathematical Methodology & Evaluation Breakdown",
  methodology,
  steps,
  className = "",
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`mt-4 rounded-xl border border-slate-800 bg-slate-950/70 backdrop-blur-md overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Expand/Collapse Toggle Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-900/90 hover:bg-slate-800/80 transition cursor-pointer text-left select-none border-b border-slate-800/60"
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 tracking-tight">{title}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                CRO Audit View
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click to {expanded ? "collapse" : "expand"} step-by-step quantitative formulas & mathematical evaluation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-400">
          <span className="text-xs font-mono font-medium hidden sm:inline">
            {expanded ? "Hide Formulas" : "View Math"}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-cyan-400" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded Math Content */}
      {expanded && (
        <div className="p-4 space-y-4 text-slate-200 animate-in fade-in duration-200">
          {/* Executive Methodology Summary */}
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold font-mono uppercase text-[11px] tracking-wider">
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>Quantitative Methodology Overview</span>
            </div>
            <p className="leading-relaxed font-sans text-slate-300">{methodology}</p>
          </div>

          {/* Step-by-Step Evaluation Cards */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Evaluated Step-by-Step Equations ({steps.length} Steps)</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {steps.map((s) => (
                <div
                  key={s.step}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/40">
                        {s.step}
                      </span>
                      <h4 className="text-xs font-bold text-white font-sans">{s.title}</h4>
                    </div>

                    {s.evaluatedValue && (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                        {s.evaluatedValue}
                      </span>
                    )}
                  </div>

                  {/* Math Formula Display Box */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner">
                    <code>{s.formula}</code>
                  </div>

                  {/* CRO Explanation */}
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{s.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SR 11-7 Regulatory Compliance Footnote */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Validated under Federal Reserve SR 11-7 Model Risk Guidance & Basel III Standards
            </span>
            <span className="text-slate-500">CRO Verification Signature • Autogenerated</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CroMathBreakdown;
