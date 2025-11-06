"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
}

const STORAGE_KEY = "wagewatchers_display_preferences";

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

  // Fetch exchange rates from API on mount
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch("/api/exchange-rates");
        if (response.ok) {
          const data = await response.json();
          if (data.rates) {
            EXCHANGE_RATES = data.rates;
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

  const setCurrency = React.useCallback((currency: DisplayCurrency) => {
    setPreferences((prev) => ({ ...prev, currency }));
  }, []);

  const setPeriod = React.useCallback((period: SalaryPeriod) => {
    setPreferences((prev) => ({ ...prev, period }));
  }, []);

  const value = React.useMemo(
    () => ({ preferences, setCurrency, setPeriod }),
    [preferences, setCurrency, setPeriod]
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
