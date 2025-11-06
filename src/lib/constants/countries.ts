export const COUNTRY_CODE_MAP: Record<string, string> = {
  Belgium: "BE",
  Netherlands: "NL",
  Germany: "DE",
  France: "FR",
} as const;

export const SUPPORTED_COUNTRIES = ["BE", "NL", "DE", "FR"] as const;

export const COUNTRY_NAMES: Record<string, string> = {
  BE: "Belgium",
  NL: "Netherlands",
  DE: "Germany",
  FR: "France",
} as const;

export const COUNTRY_TRANSLATION_KEYS: Record<string, string> = {
  BE: "belgium",
  NL: "netherlands",
  DE: "germany",
  FR: "france",
} as const;

export type SupportedCountryCode = typeof SUPPORTED_COUNTRIES[number];
export type CountryName = typeof COUNTRY_NAMES[keyof typeof COUNTRY_NAMES];
