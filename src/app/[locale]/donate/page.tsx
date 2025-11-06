import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import DonateClient from "./donate-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "donate" });

  const title = t("title");
  const description = t("subtitle");

  return {
    title,
    description,
    keywords: [
      "donate",
      "support",
      "salary transparency",
      "community",
      "open source",
      "wagewatchers",
    ],
    openGraph: {
      title,
      description,
      url: `https://wagewatchers.com/${locale}/donate`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://wagewatchers.com/${locale}/donate`,
      languages: {
        en: "https://wagewatchers.com/en/donate",
        nl: "https://wagewatchers.com/nl/donate",
        fr: "https://wagewatchers.com/fr/donate",
        de: "https://wagewatchers.com/de/donate",
      },
    },
  };
}

export default function Donate() {
  return <DonateClient />;
}
