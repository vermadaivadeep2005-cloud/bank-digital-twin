"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import LoginPage from "@/components/auth/LoginPage";
import AiChatDrawer from "@/components/ai/AiChatDrawer";
import { CustomCursor } from "@/components/common/CustomCursor";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          Loading Financial Digital Twin...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="relative z-10 flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <CustomCursor />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Global Ambient /img.jpg Background Layer for all pages (covers hero area) */}
        <div className="absolute top-0 left-0 right-0 h-[60vh] min-h-[600px] max-h-[800px] pointer-events-none overflow-hidden z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat opacity-65 dark:opacity-75 transition-opacity duration-300"
            style={{ backgroundImage: "url('/img.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/40 to-slate-950" />
        </div>
        <Topbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto relative z-10">{children}</main>
      </div>
      <AiChatDrawer />
    </div>
  );
}

export default AppShell;
