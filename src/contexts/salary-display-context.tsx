"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DEFAULT_SELECTED_COLUMNS } from "@/lib/columns-config";

export type SalaryPeriod = "monthly" | "annual";
export type DisplayCurrency = "EUR" | "USD" | "GBP";

interface SalaryDisplayPreferences {
  currency: DisplayCurrency;
  period: SalaryPeriod;
}

interface SalaryDisplayContextType {
  preferences: SalaryDisplayPreferences;
  setCurrency: (currency: DisplayCurrency) => void;
  setPeriod: (period: SalaryPeriod) => void;
  // Column visibility preferences
  selectedColumns: string[];
  setSelectedColumns: (cols: string[]) => void;
}

const STORAGE_KEY = "wagewatchers_display_preferences";
const COLUMNS_STORAGE_KEY = "wagewatchers_visible_columns";

const DEFAULT_PREFERENCES: SalaryDisplayPreferences = {
  currency: "EUR",
  period: "monthly",
};

// Default exchange rates (fallback) - will be replaced by live rates from API
let EXCHANGE_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.86,
};

const SalaryDisplayContext = createContext<SalaryDisplayContextType | undefined>(undefined);

export function SalaryDisplayProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [preferences, setPreferences] = useState<SalaryDisplayPreferences>(DEFAULT_PREFERENCES);
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (error) {
      // ignore
    }

    // Default to configured defaults
    return DEFAULT_SELECTED_COLUMNS;
  });

  // Fetch exchange rates from API on mount with local cache (1 hour)
  useEffect(() => {
    const CACHE_KEY = "wagewatchers_exchange_rates";
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour

    const fetchExchangeRates = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL && parsed.rates) {
            EXCHANGE_RATES = parsed.rates;
            return;
          }
        }

        const response = await fetch("/api/exchange-rates");
        if (response.ok) {
          const data = await response.json();
          if (data.rates) {
            EXCHANGE_RATES = data.rates;
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ rates: data.rates, timestamp: Date.now() })
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        // Will use default fallback rates
      }
    };

    fetchExchangeRates();
  }, []);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({
          currency: parsed.currency || DEFAULT_PREFERENCES.currency,
          period: parsed.period || DEFAULT_PREFERENCES.period,
        });
      }
    } catch (error) {
      console.error("Failed to load display preferences:", error);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save display preferences:", error);
    }
  }, [preferences]);

  // Save selected columns to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(selectedColumns));
    } catch (error) {
      console.error("Failed to save selected columns:", error);
    }
  }, [selectedColumns]);

  const setCurrency = React.useCallback((currency: DisplayCurrency) => {
    setPreferences((prev) => ({ ...prev, currency }));
  }, []);

  const setPeriod = React.useCallback((period: SalaryPeriod) => {
    setPreferences((prev) => ({ ...prev, period }));
  }, []);

  const setColumns = React.useCallback((cols: string[]) => {
    setSelectedColumns(cols);
  }, []);

  const value = React.useMemo(
    () => ({ preferences, setCurrency, setPeriod, selectedColumns, setSelectedColumns: setColumns }),
    [preferences, setCurrency, setPeriod, selectedColumns, setColumns]
  );

  return <SalaryDisplayContext.Provider value={value}>{children}</SalaryDisplayContext.Provider>;
}

export function useSalaryDisplay() {
  const context = useContext(SalaryDisplayContext);
  if (context === undefined) {
    throw new Error("useSalaryDisplay must be used within a SalaryDisplayProvider");
  }
  return context;
}

/**
 * Convert a salary amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string | null,
  toCurrency: DisplayCurrency
): number {
  const from = (fromCurrency?.toUpperCase() || "EUR") as DisplayCurrency;

  // If currencies don't exist in our rates, return original
  if (!EXCHANGE_RATES[from] || !EXCHANGE_RATES[toCurrency]) {
    return amount;
  }

  // Convert to EUR first, then to target currency
  const inEur = amount / EXCHANGE_RATES[from];
  return inEur * EXCHANGE_RATES[toCurrency];
}

/**
 * Convert a salary amount between monthly and annual periods
 */
export function convertPeriod(
  amount: number,
  fromPeriod: SalaryPeriod,
  toPeriod: SalaryPeriod
): number {
  if (fromPeriod === toPeriod) return amount;

  if (fromPeriod === "monthly" && toPeriod === "annual") {
    return amount * 12;
  }

  if (fromPeriod === "annual" && toPeriod === "monthly") {
    return amount / 12;
  }

  return amount;
}

/**
 * Format a salary with the user's display preferences
 */
export function formatSalaryWithPreferences(
  amount: number | null | undefined,
  sourceCurrency: string | null,
  sourceIsAnnual: boolean,
  targetCurrency: DisplayCurrency,
  targetPeriod: SalaryPeriod,
  locale: string = "en-US",
  compact: boolean = false
): string {
  if (amount === null || amount === undefined) {
    return "N/A";
  }

  // Convert currency
  let converted = convertCurrency(amount, sourceCurrency, targetCurrency);

  // Convert period - assume source data is monthly unless specified
  const sourcePeriod: SalaryPeriod = sourceIsAnnual ? "annual" : "monthly";
  converted = convertPeriod(converted, sourcePeriod, targetPeriod);

  // Format the number
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: targetCurrency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(converted));

  return compact && converted >= 1000 ? formatCompact(converted, targetCurrency) : formatted;
}

function formatCompact(amount: number, currency: DisplayCurrency): string {
  const symbol = getCurrencySymbol(currency);
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    const rounded = Math.round(millions * 10) / 10;
    return `${symbol}${rounded % 1 === 0 ? Math.floor(rounded) : rounded}M`;
  } else {
    const thousands = amount / 1000;
    const rounded = Math.round(thousands * 10) / 10;
    return `${symbol}${rounded % 1 === 0 ? Math.floor(rounded) : rounded}K`;
  }
}

function getCurrencySymbol(currency: DisplayCurrency): string {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return "€";
  }
}
