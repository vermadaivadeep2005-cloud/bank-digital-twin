"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  CurrencyCode,
  CURRENCIES,
  CurrencyConfig,
  setGlobalCurrencyFormat,
} from "@/lib/format";
import { getFxRates, FxRatesResponse } from "@/lib/api";
import { FxConverterModal } from "@/components/common/FxConverterModal";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  currencyConfig: CurrencyConfig;
  formatCurrencyAmount: (amount: number, compact?: boolean) => string;
  convertAmount: (amountUSD: number) => number;
  fxRatesInfo: FxRatesResponse | null;
  openFxModal: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [fxRatesInfo, setFxRatesInfo] = useState<FxRatesResponse | null>(null);
  const [isFxModalOpen, setIsFxModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("bank_digital_twin_currency") as CurrencyCode;
    if (saved && CURRENCIES[saved]) {
      setCurrencyState(saved);
      setGlobalCurrencyFormat(saved);
    }

    // Auto-fetch live exchange rates from European Central Bank (Frankfurter API)
    getFxRates("USD")
      .then((res) => {
        if (res && res.rates) {
          setFxRatesInfo(res);
          Object.keys(res.rates).forEach((code) => {
            const key = code as CurrencyCode;
            if (CURRENCIES[key]) {
              CURRENCIES[key].rate = res.rates[code];
            }
          });
        }
      })
      .catch((err) => {
        console.warn("Could not fetch live FX rates, using baseline static rates:", err);
      });
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

  const openFxModal = () => setIsFxModalOpen(true);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyConfig,
        formatCurrencyAmount,
        convertAmount,
        fxRatesInfo,
        openFxModal,
      }}
    >
      {children}
      <FxConverterModal isOpen={isFxModalOpen} onClose={() => setIsFxModalOpen(false)} />
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
