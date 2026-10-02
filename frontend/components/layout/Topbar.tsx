"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  LogIn,
  Menu,
  LayoutDashboard,
  Sliders,
  Scale,
  ShieldAlert,
  TrendingUp,
  Zap,
  Building2,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

import { BankLogo } from "@/components/common/BankLogo";
import { CurrencySelector } from "@/components/common/CurrencySelector";

const routeNames: Record<string, { full: string; short: string }> = {
  "/": { full: "Overview Dashboard", short: "Overview" },
  "/what-if": { full: "What-If Interactive Simulator", short: "What-If" },
  "/compliance": { full: "Regulatory Compliance Matrix", short: "Compliance" },
  "/fraud": { full: "Fraud & Anomaly Intelligence", short: "Fraud" },
  "/forecasts": { full: "Predictive Metric Forecasting", short: "Forecasts" },
  "/stress": { full: "Monte Carlo Stress Testing Engine", short: "Stress Engine" },
  "/portfolio": { full: "Loan Portfolio Analytics", short: "Portfolio" },
  "/scenarios": { full: "Predefined Macro Scenarios", short: "Scenarios" },
  "/history": { full: "Audit History & Saved Runs", short: "Audit Log" },
};

const quickLinks = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/what-if", label: "What-If", icon: Sliders },
  { href: "/compliance", label: "Compliance", icon: Scale },
  { href: "/fraud", label: "Fraud", icon: ShieldAlert },
  { href: "/forecasts", label: "Forecasts", icon: TrendingUp },
  { href: "/stress", label: "Stress Engine", icon: Zap },
  { href: "/portfolio", label: "Portfolio", icon: Building2 },
  { href: "/scenarios", label: "Scenarios", icon: Sliders },
  { href: "/history", label: "Audit Log", icon: History },
];

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  const routeInfo = routeNames[pathname] || { full: "Dashboard", short: "Dashboard" };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl transition-colors">
        {/* Main Header Container */}
        <div className="h-14 sm:h-16 px-2.5 sm:px-6 flex items-center justify-between gap-2 max-w-full">
          {/* Left Navigation & Brand */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            <button
              onClick={onMenuClick}
              className="md:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="shrink-0 flex items-center gap-1">
              <BankLogo size="sm" />
            </Link>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />

            {/* Active Page Title - Responsive for both Mobile and Desktop */}
            <h1 className="min-w-0 truncate text-xs font-semibold sm:font-mono sm:text-xs sm:uppercase sm:tracking-wider text-slate-800 dark:text-slate-200 sm:text-slate-400">
              <span className="sm:hidden">{routeInfo.short}</span>
              <span className="hidden sm:inline">{routeInfo.full}</span>
            </h1>
          </div>

          {/* Right Controls: Global Currency Selector & Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <CurrencySelector />

            {/* User Auth Profile Badge / Login Trigger */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl px-1.5 sm:px-2.5 py-1 shrink-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600/30 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40 flex items-center justify-center text-[10px] sm:text-xs font-bold font-mono shrink-0">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-slate-800 dark:text-slate-200 font-medium hidden md:inline truncate max-w-[120px]">
                  {user.full_name}
                </span>
                <button
                  onClick={logout}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-0.5 sm:ml-1 cursor-pointer shrink-0"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setAuthModalOpen(true)} className="px-2.5 py-1 text-xs shrink-0">
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Quick-Nav Sub-strip (Allows 1-Tap Page Switching on Mobile/Tablet) */}
        <nav className="md:hidden border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-950/80 px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth select-none">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
