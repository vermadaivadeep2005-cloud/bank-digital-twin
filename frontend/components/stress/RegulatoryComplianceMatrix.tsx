"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Building2,
  Globe,
  Lock,
  Search,
  CheckCircle2,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

export interface RegulatoryComplianceMatrixProps {
  preCar?: number;
  postCar?: number;
  preNpl?: number;
  postNpl?: number;
  unemploymentShock?: number;
  rateShock?: number;
  survivedPct?: number;
  expectedLoss?: number;
}

interface MatrixItem {
  id: string;
  name: string;
  frameworkId: "rbi" | "basel" | "fatf";
  frameworkName: string;
  category: string;
  preValue: number;
  postValue: number;
  minimum: number;
  buffer: number;
  unit: string;
  isMaxThreshold?: boolean;
  clause: string;
  description: string;
}

export default function RegulatoryComplianceMatrix({
  preCar = 15.2,
  postCar = 11.4,
  preNpl = 2.5,
  postNpl = 6.8,
  unemploymentShock = 0.05,
  rateShock = 0.02,
  survivedPct = 94.5,
  expectedLoss = 45000000,
}: RegulatoryComplianceMatrixProps) {
  const [selectedFramework, setSelectedFramework] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Derive dynamic stressed values for all 3 frameworks based on postCar and postNpl
  const matrixItems = useMemo<MatrixItem[]>(() => {
    // Basel metrics
    const baseTier1Pre = preCar * 0.70;
    const baseTier1Post = postCar * 0.70;

    const baseCet1Pre = preCar * 0.58;
    const baseCet1Post = postCar * 0.58;

    const preLcr = 118.5;
    const postLcr = Math.max(65.0, 118.5 - postNpl * 2.2 - rateShock * 250);

    const preNsfr = 112.4;
    const postNsfr = Math.max(70.0, 112.4 - postNpl * 1.8 - rateShock * 180);

    const preLeverage = preCar * 0.35;
    const postLeverage = postCar * 0.35;

    const preCcb = Math.max(0, preCar - 8.0);
    const postCcb = Math.max(0, postCar - 8.0);

    // RBI metrics
    const preCrr = 4.65;
    const postCrr = Math.max(3.8, 4.65 - rateShock * 10);

    const preSlr = 18.85;
    const postSlr = Math.max(16.5, 18.85 - unemploymentShock * 15);

    const prePsl = 41.8;
    const postPsl = Math.max(38.0, 41.8 - postNpl * 0.25);

    const preNetNpa = preNpl * 0.45;
    const postNetNpa = postNpl * 0.45;

    const prePcr = 74.5;
    const postPcr = Math.max(45.0, 74.5 - (postNpl - 2.5) * 3.2);

    // FATF metrics (operationally stressed by systemic shock)
    const preKyc = 98.9;
    const postKyc = Math.max(94.0, 98.9 - unemploymentShock * 12);

    const preStr = 99.4;
    const postStr = Math.max(96.0, 99.4 - postNpl * 0.3);

    const prePep = 99.8;
    const postPep = 99.8;

    const preUbo = 92.3;
    const postUbo = Math.max(88.0, 92.3 - unemploymentShock * 10);

    const preHighRisk = 1.1;
    const postHighRisk = Math.min(4.5, 1.1 + postNpl * 0.15);

    return [
      // 1. BASEL III / IV ACCORD
      {
        id: "basel_car",
        name: "Total Capital Adequacy Ratio (CAR)",
        frameworkId: "basel",
        frameworkName: "Basel III / IV Accord",
        category: "Solvency & Capital",
        preValue: Number(preCar.toFixed(2)),
        postValue: Number(postCar.toFixed(2)),
        minimum: 8.0,
        buffer: 2.5,
        unit: "%",
        isMaxThreshold: false,
        clause: "Basel III Accord Part 2 - Capital Adequacy Standard",
        description: "Minimum total capital requirement relative to risk-weighted assets (RWA).",
      },
      {
        id: "basel_tier1",
        name: "Tier 1 Capital Ratio",
        frameworkId: "basel",
        frameworkName: "Basel III / IV Accord",
        category: "Solvency & Capital",
        preValue: Number(baseTier1Pre.toFixed(2)),
        postValue: Number(baseTier1Post.toFixed(2)),
        minimum: 6.0,
        buffer: 2.5,
        unit: "%",
        isMaxThreshold: false,
        clause: "Basel III Pillar 1 - Core Tier 1 Capital Mandate",
        description: "Core equity capital and disclosed reserves ratio against total RWA.",
      },
      {
        id: "basel_cet1",
        name: "Common Equity Tier 1 (CET1) Ratio",
        frameworkId: "basel",
        frameworkName: "Basel III / IV Accord",
        category: "Solvency & Capital",
        preValue: Number(baseCet1Pre.toFixed(2)),
        postValue: Number(baseCet1Post.toFixed(2)),
        minimum: 4.5,
        buffer: 2.5,
        unit: "%",
        isMaxThreshold: false,
        clause: "Basel III Standard - CET1 Loss-Absorbing Core",
        description: "Highest quality loss-absorbing capital ratio.",
      },
      {
        id: "basel_lcr",
        name: "Liquidity Coverage Ratio (LCR)",
        frameworkId: "basel",
        frameworkName: "Basel III / IV Accord",
        category: "Liquidity Standards",
        preValue: Number(preLcr.toFixed(1)),
        postValue: Number(postLcr.toFixed(1)),
        minimum: 100.0,
        buffer: 10.0,
        unit: "%",
        isMaxThreshold: false,
        clause: "Basel III LCR Standard - 30-Day Liquidity Stress",
        description: "High-quality liquid assets (HQLA) to cover short-term net cash outflows.",
      },
      {
        id: "basel_nsfr",
        name: "Net Stable Funding Ratio (NSFR)",
        frameworkId: "basel",
        frameworkName: "Basel III / IV Accord",
        category: "Liquidity Standards",
        preValue: Number(preNsfr.toFixed(1)),
        postValue: Number(postNsfr.toFixed(1)),
        minimum: 100.0,
        buffer: 5.0,
        unit: "%",
        isMaxThreshold: false,
        clause: "Basel III NSFR Rule - Structural Funding Balance",
        description: "Available stable funding relative to required stable funding over a 1-year horizon.",
      },
      {
        id: "basel_leverage",
        name: "Basel III Leverage Ratio",
        frameworkId: "basel",
        frameworkName: "Basel III / IV Accord",
        category: "Exposure & Leverage",
        preValue: Number(preLeverage.toFixed(2)),
        postValue: Number(postLeverage.toFixed(2)),
        minimum: 3.0,
        buffer: 1.0,
        unit: "%",
        isMaxThreshold: false,
        clause: "Basel III Leverage Ratio Standard",
        description: "Non-risk-weighted leverage metric comparing Tier 1 capital to total exposure.",
      },
      {
        id: "basel_ccb",
        name: "Capital Conservation Buffer (CCB)",
        frameworkId: "basel",
        frameworkName: "Basel III / IV Accord",
        category: "Solvency & Capital",
        preValue: Number(preCcb.toFixed(2)),
        postValue: Number(postCcb.toFixed(2)),
        minimum: 2.5,
        buffer: 0.5,
        unit: "%",
        isMaxThreshold: false,
        clause: "Basel III CCB Mandate - Capital Buffers",
        description: "Mandatory capital buffer designed to absorb losses during periods of financial stress.",
      },

      // 2. RBI REGULATORY FRAMEWORK
      {
        id: "rbi_crr",
        name: "Cash Reserve Ratio (CRR)",
        frameworkId: "rbi",
        frameworkName: "RBI Regulatory Framework",
        category: "Monetary Policy & Liquidity",
        preValue: preCrr,
        postValue: Number(postCrr.toFixed(2)),
        minimum: 4.5,
        buffer: 0.5,
        unit: "%",
        isMaxThreshold: false,
        clause: "RBI Act 1934 - Section 42(1)",
        description: "Mandatory share of net demand and time liabilities (NDTL) held as cash with RBI.",
      },
      {
        id: "rbi_slr",
        name: "Statutory Liquidity Ratio (SLR)",
        frameworkId: "rbi",
        frameworkName: "RBI Regulatory Framework",
        category: "Monetary Policy & Liquidity",
        preValue: preSlr,
        postValue: Number(postSlr.toFixed(2)),
        minimum: 18.0,
        buffer: 2.0,
        unit: "%",
        isMaxThreshold: false,
        clause: "Banking Regulation Act 1949 - Section 24",
        description: "Minimum percentage of NDTL maintained in safe government securities & gold.",
      },
      {
        id: "rbi_psl",
        name: "Priority Sector Lending (PSL) Compliance",
        frameworkId: "rbi",
        frameworkName: "RBI Regulatory Framework",
        category: "Social & Sectoral Credit",
        preValue: prePsl,
        postValue: Number(postPsl.toFixed(2)),
        minimum: 40.0,
        buffer: 5.0,
        unit: "%",
        isMaxThreshold: false,
        clause: "RBI Master Direction - Priority Sector Lending Targets",
        description: "Mandatory credit allocation threshold to agriculture, MSMEs, and weaker sectors.",
      },
      {
        id: "rbi_gross_npa",
        name: "Gross NPA Ratio (PCA Trigger Threshold)",
        frameworkId: "rbi",
        frameworkName: "RBI Regulatory Framework",
        category: "Asset Quality & Solvency",
        preValue: Number(preNpl.toFixed(2)),
        postValue: Number(postNpl.toFixed(2)),
        minimum: 6.0,
        buffer: 1.5,
        unit: "%",
        isMaxThreshold: true,
        clause: "RBI Prompt Corrective Action (PCA) Framework v2024",
        description: "Maximum permissible non-performing asset limit before triggering regulatory restrictions.",
      },
      {
        id: "rbi_net_npa",
        name: "Net NPA Ratio Limit",
        frameworkId: "rbi",
        frameworkName: "RBI Regulatory Framework",
        category: "Asset Quality & Solvency",
        preValue: Number(preNetNpa.toFixed(2)),
        postValue: Number(postNetNpa.toFixed(2)),
        minimum: 3.0,
        buffer: 1.0,
        unit: "%",
        isMaxThreshold: true,
        clause: "RBI Prudential Norms on Income Recognition & Provisioning",
        description: "Net unprovisioned bad loans percentage against total net advances.",
      },
      {
        id: "rbi_pcr",
        name: "Provision Coverage Ratio (PCR)",
        frameworkId: "rbi",
        frameworkName: "RBI Regulatory Framework",
        category: "Asset Quality & Solvency",
        preValue: prePcr,
        postValue: Number(postPcr.toFixed(1)),
        minimum: 70.0,
        buffer: 5.0,
        unit: "%",
        isMaxThreshold: false,
        clause: "RBI Master Circular - NPA Provisioning Directives",
        description: "Percentage of bad loans covered by provisions set aside by the bank.",
      },

      // 3. FATF STANDARDS
      {
        id: "fatf_kyc",
        name: "Customer Due Diligence (CDD/KYC) Verification",
        frameworkId: "fatf",
        frameworkName: "FATF Standards",
        category: "AML / CFT Compliance",
        preValue: preKyc,
        postValue: Number(postKyc.toFixed(2)),
        minimum: 98.0,
        buffer: 1.5,
        unit: "%",
        isMaxThreshold: false,
        clause: "FATF Recommendation 10 - Customer Due Diligence",
        description: "Percentage of active accounts with verified identity documentation and risk classification.",
      },
      {
        id: "fatf_str",
        name: "Suspicious Transaction Report (STR) Filing Rate",
        frameworkId: "fatf",
        frameworkName: "FATF Standards",
        category: "AML / CFT Compliance",
        preValue: preStr,
        postValue: Number(postStr.toFixed(2)),
        minimum: 99.0,
        buffer: 0.8,
        unit: "%",
        isMaxThreshold: false,
        clause: "FATF Recommendation 20 - Suspicious Transaction Reporting",
        description: "Timely filing of suspicious transaction reports to Financial Intelligence Units.",
      },
      {
        id: "fatf_pep",
        name: "PEP & Sanctions Screening Resolution Rate",
        frameworkId: "fatf",
        frameworkName: "FATF Standards",
        category: "AML / CFT Compliance",
        preValue: prePep,
        postValue: Number(postPep.toFixed(2)),
        minimum: 99.5,
        buffer: 0.4,
        unit: "%",
        isMaxThreshold: false,
        clause: "FATF Recommendation 12 - Politically Exposed Persons",
        description: "Enhanced due diligence resolution speed for PEP customer hits and family associate matches.",
      },
      {
        id: "fatf_ubo",
        name: "Ultimate Beneficial Ownership (UBO) Transparency",
        frameworkId: "fatf",
        frameworkName: "FATF Standards",
        category: "AML / CFT Compliance",
        preValue: preUbo,
        postValue: Number(postUbo.toFixed(2)),
        minimum: 90.0,
        buffer: 5.0,
        unit: "%",
        isMaxThreshold: false,
        clause: "FATF Recommendation 24 & 25 - Corporate Transparency",
        description: "Identification and verification index of natural persons exercising ultimate control over corporate entities.",
      },
      {
        id: "fatf_hr",
        name: "High-Risk Jurisdiction Exposure Threshold",
        frameworkId: "fatf",
        frameworkName: "FATF Standards",
        category: "AML / CFT Compliance",
        preValue: preHighRisk,
        postValue: Number(postHighRisk.toFixed(2)),
        minimum: 2.0,
        buffer: 0.5,
        unit: "%",
        isMaxThreshold: true,
        clause: "FATF Recommendation 19 - High-Risk Country Countermeasures",
        description: "Maximum portfolio transaction exposure limit to FATF grey-listed or high-risk jurisdictions.",
      },
    ];
  }, [preCar, postCar, preNpl, postNpl, unemploymentShock, rateShock]);

  // Evaluate status helper for postValue
  const getStatus = (item: MatrixItem): "pass" | "warning" | "fail" => {
    const val = item.postValue;
    if (item.isMaxThreshold) {
      if (val > item.minimum) return "fail";
      if (val > item.minimum - item.buffer) return "warning";
      return "pass";
    } else {
      if (val < item.minimum) return "fail";
      if (val < item.minimum + item.buffer) return "warning";
      return "pass";
    }
  };

  // Compute framework summary cards
  const frameworkSummaries = useMemo(() => {
    const frameworks = [
      { id: "rbi", name: "RBI Regulatory Framework", type: "Local Regulatory", icon: Building2, desc: "Monetary Policy, CRR, SLR & PCA Norms" },
      { id: "basel", name: "Basel III / IV Accord", type: "International Solvency", icon: Globe, desc: "Global Capital Adequacy, Solvency & LCR" },
      { id: "fatf", name: "FATF Standards", type: "International Risk", icon: Lock, desc: "AML / CFT Counter-Financing & Sanctions" },
    ];

    return frameworks.map((fw) => {
      const items = matrixItems.filter((i) => i.frameworkId === fw.id);
      const passed = items.filter((i) => getStatus(i) === "pass").length;
      const warning = items.filter((i) => getStatus(i) === "warning").length;
      const fail = items.filter((i) => getStatus(i) === "fail").length;

      const overall = fail > 0 ? "BREACH" : warning > 0 ? "WARNING" : "PASS";

      return {
        ...fw,
        total: items.length,
        passed,
        warning,
        fail,
        overall,
      };
    });
  }, [matrixItems]);

  // Filtered matrix items
  const filteredItems = useMemo(() => {
    return matrixItems.filter((item) => {
      // Framework filter
      if (selectedFramework !== "all" && item.frameworkId !== selectedFramework) return false;

      // Status filter
      const st = getStatus(item);
      if (selectedStatus !== "all" && st !== selectedStatus) return false;

      // Search filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchClause = item.clause.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        if (!matchName && !matchClause && !matchCategory) return false;
      }

      return true;
    });
  }, [matrixItems, selectedFramework, selectedStatus, searchQuery]);

  const totalPassed = matrixItems.filter((i) => getStatus(i) === "pass").length;
  const totalWarning = matrixItems.filter((i) => getStatus(i) === "warning").length;
  const totalBreach = matrixItems.filter((i) => getStatus(i) === "fail").length;

  return (
    <Card className="p-6 bg-slate-900/90 border-slate-800 shadow-2xl space-y-6 backdrop-blur-xl rounded-2xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Scale className="h-5 w-5 text-indigo-400" />
            </div>
            <CardTitle className="text-xl font-bold text-white tracking-tight">
              Post-Stress Regulatory Compliance Matrix
            </CardTitle>
            <Badge
              className={`text-xs px-3 py-1 font-mono font-semibold border ${
                totalBreach > 0
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : totalWarning > 0
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {totalBreach > 0 ? "REGULATORY BREACH DETECTED" : totalWarning > 0 ? "COMPLIANCE WATCHLIST" : "ALL 3 FRAMEWORKS PASS"}
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Real-time compliance evaluation for <strong>RBI, Basel III/IV, and FATF</strong> based on post-simulation capital and liquidity metrics.
          </CardDescription>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-400">Survival Rate:</span>
            <span className={`font-bold ${survivedPct >= 80 ? "text-emerald-400" : "text-rose-400"}`}>
              {survivedPct.toFixed(1)}%
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-400">Post-Stress CAR:</span>
            <span className={`font-bold ${postCar >= 8.0 ? "text-emerald-400" : "text-rose-400"}`}>
              {postCar.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 3 Core Regulatory Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {frameworkSummaries.map((fw) => {
          const Icon = fw.icon;
          const isBreach = fw.overall === "BREACH";
          const isWarn = fw.overall === "WARNING";

          return (
            <div
              key={fw.id}
              onClick={() => setSelectedFramework(selectedFramework === fw.id ? "all" : fw.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                selectedFramework === fw.id
                  ? "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-900/20"
                  : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{fw.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{fw.type}</span>
                  </div>
                </div>

                <Badge
                  className={`text-[10px] font-mono font-bold ${
                    isBreach
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : isWarn
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}
                >
                  {fw.overall}
                </Badge>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">{fw.desc}</p>

              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80">
                <span className="text-emerald-400">{fw.passed} Passed</span>
                {fw.warning > 0 && <span className="text-amber-400">{fw.warning} Warning</span>}
                {fw.fail > 0 && <span className="text-rose-400 font-bold">{fw.fail} Breach</span>}
                <span className="text-slate-500">Total: {fw.total}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
        {/* Framework Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedFramework("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedFramework === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            All Frameworks (3)
          </button>

          <button
            onClick={() => setSelectedFramework("rbi")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedFramework === "rbi"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            RBI Framework
          </button>

          <button
            onClick={() => setSelectedFramework("basel")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedFramework === "basel"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Basel III / IV
          </button>

          <button
            onClick={() => setSelectedFramework("fatf")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedFramework === "fatf"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            FATF Standards
          </button>
        </div>

        {/* Status Filter & Search input */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses ({matrixItems.length})</option>
            <option value="pass">Passed ({totalPassed})</option>
            <option value="warning">Warning ({totalWarning})</option>
            <option value="fail">Breach / Fail ({totalBreach})</option>
          </select>

          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search clause or metric..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Compliance Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono uppercase text-[11px]">
              <th className="py-3 px-4">Metric & Clause</th>
              <th className="py-3 px-3">Framework</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 text-right">Pre-Stress Position</th>
              <th className="py-3 px-3 text-right">Stressed Post-Shock</th>
              <th className="py-3 px-3 text-right">Regulatory Target</th>
              <th className="py-3 px-4 text-center">Compliance State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredItems.map((item) => {
              const status = getStatus(item);
              const delta = item.postValue - item.preValue;
              const isExpanded = expandedRow === item.id;

              return (
                <React.Fragment key={item.id}>
                  <tr
                    onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                    className="hover:bg-slate-900/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                        )}
                        <div>
                          <div className="font-semibold text-white text-xs group-hover:text-indigo-300 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.clause}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <Badge
                        variant="neutral"
                        className={`text-[10px] font-mono border ${
                          item.frameworkId === "rbi"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            : item.frameworkId === "basel"
                            ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                            : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                        }`}
                      >
                        {item.frameworkName}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-3 text-slate-400 text-xs font-mono">
                      {item.category}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                      {item.preValue}
                      {item.unit}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={
                            status === "fail"
                              ? "text-rose-400"
                              : status === "warning"
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          {item.postValue}
                          {item.unit}
                        </span>
                        {delta !== 0 && (
                          <span
                            className={`text-[10px] ${
                              (delta > 0 && !item.isMaxThreshold) || (delta < 0 && item.isMaxThreshold)
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            ({delta > 0 ? "+" : ""}
                            {delta.toFixed(1)}
                            {item.unit})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                      {item.isMaxThreshold ? "≤ " : "≥ "}
                      {item.minimum}
                      {item.unit}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 flex items-center justify-center space-x-1.5 border mx-auto w-fit ${
                          status === "fail"
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-900/30"
                            : status === "warning"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        }`}
                      >
                        {status === "fail" ? (
                          <>
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>BREACH</span>
                          </>
                        ) : status === "warning" ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>WATCHLIST</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>PASSED</span>
                          </>
                        )}
                      </Badge>
                    </td>
                  </tr>

                  {/* Expanded Detail Drawer Row */}
                  {isExpanded && (
                    <tr className="bg-slate-900/90 border-b border-slate-800">
                      <td colSpan={7} className="p-4 text-xs text-slate-300">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <div className="space-y-1.5 max-w-2xl">
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-indigo-400" />
                              <span className="font-semibold text-white">{item.name} Reference</span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
                            <p className="text-[11px] font-mono text-indigo-300">Clause: {item.clause}</p>
                          </div>

                          <div className="space-y-1 font-mono text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800 shrink-0">
                            <div>Threshold Minimum: {item.minimum}{item.unit}</div>
                            <div>Safety Buffer: {item.buffer}{item.unit}</div>
                            <div className="text-slate-400">Direction: {item.isMaxThreshold ? "Maximum Permissible Ceiling" : "Minimum Required Floor"}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                  No regulatory metrics found matching the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Regulatory Solvency Executive Summary Box */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            totalBreach > 0
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : totalWarning > 0
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white">Executive Solvency & Regulatory Diagnosis</h5>
            <p className="text-[11px] text-slate-400">
              {totalBreach > 0
                ? `Simulated stress vector triggers ${totalBreach} regulatory breach(es). Prompt Corrective Action or capital restoration required.`
                : totalWarning > 0
                ? `Simulated stress test maintains solvency but places ${totalWarning} metric(s) on regulatory watchlist.`
                : "Simulated stress scenario maintains clean regulatory compliance across all RBI, Basel III/IV, and FATF standards."}
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] font-mono text-slate-500 shrink-0">
          Evaluated across 3 Core Frameworks (18 Regulatory Metrics)
        </div>
      </div>
    </Card>
  );
}
