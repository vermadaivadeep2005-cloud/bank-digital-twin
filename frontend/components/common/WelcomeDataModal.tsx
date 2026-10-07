"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  RefreshCw,
  X,
  ShieldCheck,
  ArrowRight,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WelcomeDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImportCsv: () => void;
  onGenerateBankData: () => Promise<void>;
  generating: boolean;
}

export function WelcomeDataModal({
  isOpen,
  onClose,
  onOpenImportCsv,
  onGenerateBankData,
  generating,
}: WelcomeDataModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-mono px-3 py-1">
                Aegis Bank Digital Twin
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono px-3 py-1">
                Setup Assistant
              </Badge>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Database className="w-6 h-6 text-indigo-400" />
              <span>Initialize Portfolio Data</span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Please upload CSV or generate data to access all features of the app (Monte Carlo stress testing, AI risk copilot, RBI compliance matrix, and ML credit predictions).
            </p>
          </div>

          {/* Action Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1: Import CSV */}
            <div
              onClick={() => {
                onClose();
                onOpenImportCsv();
              }}
              className="group cursor-pointer p-4 rounded-2xl border border-slate-800 bg-slate-950/70 hover:bg-slate-950 hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Upload Portfolio CSV
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Import real banking loan records & borrower attributes directly.
                </p>
              </div>

              <div className="flex items-center text-xs font-semibold text-emerald-400 gap-1 pt-2 group-hover:translate-x-1 transition-transform">
                <span>Upload File</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Option 2: Generate Synthetic Data */}
            <div
              onClick={async () => {
                await onGenerateBankData();
                onClose();
              }}
              className="group cursor-pointer p-4 rounded-2xl border border-slate-800 bg-slate-950/70 hover:bg-slate-950 hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <RefreshCw className={`w-5 h-5 ${generating ? "animate-spin" : ""}`} />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  Generate Synthetic Data
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Instantly populate 5,000 synthetic loans, customers & credit profiles.
                </p>
              </div>

              <div className="flex items-center text-xs font-semibold text-indigo-400 gap-1 pt-2 group-hover:translate-x-1 transition-transform">
                <span>{generating ? "Generating..." : "Generate 5k Loans"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Footer Notice & Dismiss Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Basel III & RBI Compliant Engine</span>
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs"
            >
              Explore Sample Mode
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
