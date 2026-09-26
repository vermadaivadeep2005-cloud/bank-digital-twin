"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Zap,
  Building2,
  Sliders,
  History,
  ChevronLeft,
  Scale,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BankLogo } from "@/components/common/BankLogo";

const items = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/what-if", label: "What-If Simulator", icon: Sliders },
  { href: "/compliance", label: "Compliance Matrix", icon: Scale },
  { href: "/fraud", label: "Fraud Intelligence", icon: ShieldAlert },
  { href: "/forecasts", label: "Predictive Forecasts", icon: TrendingUp },
  { href: "/stress", label: "Stress Engine", icon: Zap },
  { href: "/portfolio", label: "Loan Portfolio", icon: Building2 },
  { href: "/scenarios", label: "Scenario Library", icon: Sliders },
  { href: "/history", label: "Audit History", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="sticky top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between z-40 select-none transition-colors overflow-hidden"
    >
      <div>
        {/* Top Header & Brand */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-slate-200 dark:border-slate-800 transition-all px-4",
            collapsed ? "justify-center px-0" : "justify-between"
          )}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="cursor-pointer"
              title="Expand Sidebar"
            >
              <BankLogo size="sm" />
            </button>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-2 overflow-hidden">
                <BankLogo size="md" withText />
              </Link>

              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className={cn("mt-3 space-y-1.5", collapsed ? "px-2" : "px-3")}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-xl text-xs font-medium transition-all group overflow-hidden whitespace-nowrap",
                  collapsed
                    ? "justify-center w-10 h-10 mx-auto"
                    : "gap-3 px-3 py-2.5",
                  isActive
                    ? collapsed
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-indigo-600 dark:text-white bg-indigo-500/10 dark:bg-indigo-600/20 font-semibold border-l-2 border-indigo-600 dark:border-indigo-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? collapsed
                        ? "text-white"
                        : "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        {collapsed ? (
          <div
            className="w-10 h-10 mx-auto rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-500"
            title="Monte Carlo Engine Active"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">Simulation Engine</span>
              <span className="text-[9px] font-mono text-slate-500">10,000 Monte Carlo Paths</span>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
