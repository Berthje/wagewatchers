import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import StatisticsClient from "./statistics-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "statistics" });

    const title = t("title");
    const description = t("subtitle");

    return {
        title,
        description,
        keywords: [
            "salary statistics",
            "salary data analysis",
            "compensation trends",
            "market insights",
            "salary comparison",
            "job market data",
        ],
        openGraph: {
            title,
            description,
            url: `https://wagewatchers.com/${locale}/statistics`,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        alternates: {
            canonical: `https://wagewatchers.com/${locale}/statistics`,
        },
    };
}

export default function Statistics() {
    return <StatisticsClient />;
}
