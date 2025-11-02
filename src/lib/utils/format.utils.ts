/**
 * Format Utilities
 * Helper functions for formatting data
 */

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(
    num: number,
    locale: string = "en-US",
    compact: boolean = false,
): string {
    if (compact) {
        if (num >= 1000000) {
            const millions = num / 1000000;
            // Round to 1 decimal place, but avoid .0
            const rounded = Math.round(millions * 10) / 10;
            return `${rounded % 1 === 0 ? Math.floor(rounded) : rounded}M`;
        } else if (num >= 1000) {
            const thousands = num / 1000;
            // Round to 1 decimal place, but avoid .0
            const rounded = Math.round(thousands * 10) / 10;
            return `${rounded % 1 === 0 ? Math.floor(rounded) : rounded}K`;
        }
    }
    return new Intl.NumberFormat(locale).format(num);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency?: string | null): string {
    if (!currency) return "€"; // Default to Euro
    switch (currency.toUpperCase()) {
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

/**
 * Format time until retry (e.g., "2 hours 15 minutes")
 */
export function formatTimeUntilRetry(retryAfter: Date): string {
    const now = new Date();
    const diffMs = retryAfter.getTime() - now.getTime();

    if (diffMs <= 0) return "now";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (diffHours > 0) {
        const hourText = diffHours === 1 ? 'hour' : 'hours';
        const minText = remainingMins === 1 ? 'minute' : 'minutes';
        return `${diffHours} ${hourText} ${remainingMins} ${minText}`;
    } else if (diffMins > 0) {
        const minText = diffMins === 1 ? 'minute' : 'minutes';
        return `${diffMins} ${minText}`;
    } else {
        return "less than a minute";
    }
}
export function formatDate(
    date: Date | string,
    locale: string = "en-US",
): string {
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    const timeStr = dateObj.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString();
}

/**
 * Get display label for a field value
 */
export function getFieldDisplayValue(
    fieldName: string,
    value: string | null | undefined,
    fieldConfigs: Record<string, any>,
    t?: (key: string) => string,
): string | undefined {
    if (!value) return undefined;

    const fieldConfig = fieldConfigs[fieldName];
    if (!fieldConfig?.options) {
        // For fields without options, just return the value with basic formatting
        if (fieldName === 'civilStatus') {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
        return value;
    }

    // Find the option with matching value
    const option = fieldConfig.options.find((opt: any) => opt.value === value);
    if (option) {
        // If the label is a translation key, translate it
        if (t && typeof option.label === 'string' && option.label.startsWith('formOptions.')) {
            return t(option.label);
        }
        return option.label;
    }

    // Fallback to the raw value if no matching option found
    return value;
}
