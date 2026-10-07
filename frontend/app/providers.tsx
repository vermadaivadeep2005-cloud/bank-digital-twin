"use client";

import React, { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { pingBackend } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    pingBackend();
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <CurrencyProvider>
          {children}
          <Toaster position="top-right" theme="dark" richColors />
        </CurrencyProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
