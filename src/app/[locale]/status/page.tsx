import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import StatusClient from "./status-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "status" });

  const title = `${t("title")} - WageWatchers`;
  const description = t("subtitle");

  return {
    title,
    description,
    keywords: [
      "report status",
      "bug tracking",
      "feature requests",
      "feedback status",
      "WageWatchers support",
    ],
    openGraph: {
      title,
      description,
      url: `https://wagewatchers.com/${locale}/status`,
      siteName: "WageWatchers",
      locale: locale === "en" ? "en_US" : `${locale}_${locale.toUpperCase()}`,
      type: "website",
    },
    alternates: {
      canonical: `https://wagewatchers.com/${locale}/status`,
      languages: {
        en: "https://wagewatchers.com/en/status",
        nl: "https://wagewatchers.com/nl/status",
        fr: "https://wagewatchers.com/fr/status",
        de: "https://wagewatchers.com/de/status",
      },
    },
  };
}

export default function StatusPage() {
  return <StatusClient />;
}
