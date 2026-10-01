"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  CurrencyCode,
  CURRENCIES,
  CurrencyConfig,
  setGlobalCurrencyFormat,
} from "@/lib/format";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  currencyConfig: CurrencyConfig;
  formatCurrencyAmount: (amount: number, compact?: boolean) => string;
  convertAmount: (amountUSD: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const saved = localStorage.getItem("bank_digital_twin_currency") as CurrencyCode;
    if (saved && CURRENCIES[saved]) {
      setCurrencyState(saved);
      setGlobalCurrencyFormat(saved);
    }
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    if (CURRENCIES[code]) {
      setCurrencyState(code);
      setGlobalCurrencyFormat(code);
      localStorage.setItem("bank_digital_twin_currency", code);
    }
  };

  const currencyConfig = CURRENCIES[currency] || CURRENCIES.USD;

  const formatCurrencyAmount = (amount: number, compact = false) => {
    const converted = amount * currencyConfig.rate;
    if (compact) {
      const absVal = Math.abs(converted);
      if (absVal >= 1_000_000_000) {
        return `${currencyConfig.symbol}${(converted / 1_000_000_000).toFixed(2)}B`;
      }
      if (absVal >= 1_000_000) {
        return `${currencyConfig.symbol}${(converted / 1_000_000).toFixed(2)}M`;
      }
      if (absVal >= 1_000) {
        return `${currencyConfig.symbol}${(converted / 1_000).toFixed(1)}K`;
      }
    }

    return new Intl.NumberFormat(currencyConfig.locale, {
      style: "currency",
      currency: currencyConfig.code,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  const convertAmount = (amountUSD: number) => {
    return amountUSD * currencyConfig.rate;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyConfig,
        formatCurrencyAmount,
        convertAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
