import createMiddleware from "next-intl/middleware";
import { locales } from "./src/i18n";

export default createMiddleware({
    // A list of all locales that are supported
    locales: locales,

    // Used when no locale matches
    defaultLocale: "en",

    // Always show the locale prefix in the URL
    localePrefix: "always",
});

export const config = {
    // Match all pathnames except for
    // - Admin routes (no localization for admin)
    // - API routes
    // - _next (Next.js internals)
    // - files with extensions (e.g. favicon.ico)
    matcher: [String.raw`/((?!admin|api|_next|.*\..*).*)`],
};
