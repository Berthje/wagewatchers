import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import en from "./messages/en.json";
import nl from "./messages/nl.json";
import fr from "./messages/fr.json";
import de from "./messages/de.json";

// Can be imported from a shared config
export const locales = ["en", "nl", "fr", "de"] as const;
export type Locale = (typeof locales)[number];

const messages = {
    en,
    nl,
    fr,
    de,
};

export default getRequestConfig(async ({ locale }) => {
    // Validate that the incoming `locale` parameter is valid
    const validatedLocale = locale || "en";
    if (!locales.includes(validatedLocale as any)) {
        notFound();
    }

    return {
        locale: validatedLocale,
        messages: messages[validatedLocale as keyof typeof messages],
    };
});
