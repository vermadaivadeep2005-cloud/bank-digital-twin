"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { LogOut, LogIn, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

import { BankLogo } from "@/components/common/BankLogo";
import { CurrencySelector } from "@/components/common/CurrencySelector";

const routeNames: Record<string, string> = {
  "/": "Overview Dashboard",
  "/what-if": "What-If Interactive Simulator",
  "/compliance": "Regulatory Compliance Dashboard",

  "/fraud": "Fraud & Anomaly Intelligence Center",
  "/forecasts": "Predictive Metric Forecasting",
  "/stress": "Monte Carlo Stress Testing Engine",
  "/portfolio": "Loan Portfolio Analytics",
  "/scenarios": "Predefined Macro Scenarios",
  "/history": "Audit History & Saved Runs",
};

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  const pageTitle = routeNames[pathname] || "Dashboard";

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
        {/* Page Title & Breadcrumbs */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BankLogo size="sm" />
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
          <h1 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono truncate max-w-[150px] sm:max-w-none">
            {pageTitle}
          </h1>
        </div>

        {/* Right Controls: Global Currency Selector & Auth */}
        <div className="flex items-center gap-3">
          <CurrencySelector />

          {/* User Auth Profile Badge / Login Trigger */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1">
              <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40 flex items-center justify-center text-xs font-bold font-mono">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-800 dark:text-slate-200 font-medium hidden sm:inline">{user.full_name}</span>
              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setAuthModalOpen(true)}>
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
