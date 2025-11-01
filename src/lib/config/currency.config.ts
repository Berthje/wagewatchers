/**
 * Currency Configuration
 * Centralized currency definitions for the application
 */

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    labelKey: string;
}

/**
 * Supported currencies in the application
 * These currencies are:
 * - Fetched daily by the exchange rates cron job
 * - Available in currency selectors throughout the app
 * - Defined in translation files
 */
export const SUPPORTED_CURRENCIES: Currency[] = [
    {
        code: "EUR",
        name: "Euro",
        symbol: "€",
        labelKey: "nav.currencies.EUR",
    },
    {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        labelKey: "nav.currencies.USD",
    },
    {
        code: "GBP",
        name: "British Pound",
        symbol: "£",
        labelKey: "nav.currencies.GBP",
    },
];

/**
 * Default currency for the application
 */
export const DEFAULT_CURRENCY = "EUR";

/**
 * Get currency by code
 */
export const getCurrencyByCode = (code: string): Currency | undefined => {
    return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
};

/**
 * Get all supported currency codes
 */
export const getSupportedCurrencyCodes = (): string[] => {
    return SUPPORTED_CURRENCIES.map(currency => currency.code);
};

/**
 * Check if a currency code is supported
 */
export const isCurrencySupported = (code: string): boolean => {
    return getSupportedCurrencyCodes().includes(code);
};

/**
 * Fallback exchange rates when database is unavailable
 * These should match the currencies defined above
 */
export const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
    EUR: 1,
    USD: 1.09,
    GBP: 0.86,
};