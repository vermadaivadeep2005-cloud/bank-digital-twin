export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // Conversion rate relative to 1.0 USD
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸", rate: 1.0, locale: "en-US" },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳", rate: 84.5, locale: "en-IN" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", rate: 0.92, locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧", rate: 0.78, locale: "en-GB" },
};

let currentGlobalCurrency: CurrencyCode = "USD";

export function setGlobalCurrencyFormat(code: CurrencyCode) {
  if (CURRENCIES[code]) {
    currentGlobalCurrency = code;
  }
}

export function getGlobalCurrencyCode(): CurrencyCode {
  return currentGlobalCurrency;
}

export function formatCurrency(
  amount: number,
  compact = false,
  currencyCode?: CurrencyCode
): string {
  const code = currencyCode || currentGlobalCurrency || "USD";
  const config = CURRENCIES[code] || CURRENCIES.USD;
  const convertedAmount = amount * config.rate;

  if (compact) {
    const absVal = Math.abs(convertedAmount);
    if (absVal >= 1_000_000_000) {
      return `${config.symbol}${(convertedAmount / 1_000_000_000).toFixed(2)}B`;
    }
    if (absVal >= 1_000_000) {
      return `${config.symbol}${(convertedAmount / 1_000_000).toFixed(2)}M`;
    }
    if (absVal >= 1_000) {
      return `${config.symbol}${(convertedAmount / 1_000).toFixed(1)}K`;
    }
  }

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    maximumFractionDigits: 0,
  }).format(convertedAmount);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
