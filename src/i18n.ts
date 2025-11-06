// Can be imported from a shared config
export const locales = ["en", "nl", "fr", "de"] as const;
export type Locale = (typeof locales)[number];
