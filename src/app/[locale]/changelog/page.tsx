import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { changelogEntries } from "@/lib/changelog-data";
import { ChangelogClient } from "./changelog-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelog" });

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    keywords: [
      "changelog",
      "updates",
      "features",
      "improvements",
      "salary platform",
      "wagewatchers",
    ],
    openGraph: {
      title,
      description,
      url: `https://wagewatchers.com/${locale}/changelog`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://wagewatchers.com/en/changelog`,
      languages: {
        en: "https://wagewatchers.com/en/changelog",
        nl: "https://wagewatchers.com/nl/changelog",
        fr: "https://wagewatchers.com/fr/changelog",
        de: "https://wagewatchers.com/de/changelog",
        "x-default": "https://wagewatchers.com/en/changelog",
      },
    },
  };
}

export default async function ChangelogPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <ChangelogClient locale={locale} changelogEntries={changelogEntries} />;
}
