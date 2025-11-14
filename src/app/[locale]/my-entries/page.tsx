import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import MyEntriesClient from "./my-entries-client";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myEntries" });

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    keywords: [
      "my salary entries",
      "manage salary data",
      "edit salary entries",
      "anonymous ownership",
      "salary transparency",
    ],
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: `https://wagewatchers.com/${locale}/my-entries`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://wagewatchers.com/en/my-entries`,
      languages: {
        en: "https://wagewatchers.com/en/my-entries",
        nl: "https://wagewatchers.com/nl/my-entries",
        fr: "https://wagewatchers.com/fr/my-entries",
        de: "https://wagewatchers.com/de/my-entries",
        "x-default": "https://wagewatchers.com/en/my-entries",
      },
    },
  };
}

export default function MyEntriesPage() {
  return (
    <Suspense fallback={null}>
      <MyEntriesClient />
    </Suspense>
  );
}
