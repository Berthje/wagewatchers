import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import AddClient from "./add-client";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "add" });

  const title = t("title");
  const description = t("subtitle");

  return {
    title,
    description,
    keywords: [
      "share salary",
      "salary transparency",
      "anonymous salary entry",
      "job compensation",
      "salary data",
    ],
    openGraph: {
      title,
      description,
      url: `https://wagewatchers.com/${locale}/add`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://wagewatchers.com/en/add`,
      languages: {
        en: "https://wagewatchers.com/en/add",
        nl: "https://wagewatchers.com/nl/add",
        fr: "https://wagewatchers.com/fr/add",
        de: "https://wagewatchers.com/de/add",
        "x-default": "https://wagewatchers.com/en/add",
      },
    },
  };
}

export default function AddEntry() {
  return (
    <Suspense fallback={null}>
      <AddClient />
    </Suspense>
  );
}
