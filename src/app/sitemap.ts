import { MetadataRoute } from "next";
import { locales } from "../i18n";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://wagewatchers.com";

    // Generate sitemap entries for all locales and main pages
    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Add entries for each locale
    for (const locale of locales) {
        const localeEntries: MetadataRoute.Sitemap = [
            // Home page
            {
                url: `${baseUrl}/${locale}`,
                lastModified: new Date(),
                changeFrequency: "weekly",
                priority: 1,
            },
            // Dashboard
            {
                url: `${baseUrl}/${locale}/dashboard`,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 0.9,
            },
            // Add entry form
            {
                url: `${baseUrl}/${locale}/add`,
                lastModified: new Date(),
                changeFrequency: "monthly",
                priority: 0.7,
            },
            // Statistics
            {
                url: `${baseUrl}/${locale}/statistics`,
                lastModified: new Date(),
                changeFrequency: "weekly",
                priority: 0.8,
            },
            // My entries
            {
                url: `${baseUrl}/${locale}/my-entries`,
                lastModified: new Date(),
                changeFrequency: "monthly",
                priority: 0.6,
            },
            // Feedback
            {
                url: `${baseUrl}/${locale}/feedback`,
                lastModified: new Date(),
                changeFrequency: "monthly",
                priority: 0.5,
            },
            // Donate
            {
                url: `${baseUrl}/${locale}/donate`,
                lastModified: new Date(),
                changeFrequency: "monthly",
                priority: 0.4,
            },
            // Status
            {
                url: `${baseUrl}/${locale}/status`,
                lastModified: new Date(),
                changeFrequency: "weekly",
                priority: 0.6,
            },
        ];

        sitemapEntries.push(...localeEntries);
    }

    return sitemapEntries;
}
