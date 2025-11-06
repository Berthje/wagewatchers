import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FeedbackClient from "./feedback-client";

interface FeedbackPageProps {
  readonly params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: FeedbackPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feedback" });

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `https://wagewatchers.com/${locale}/feedback`,
      languages: {
        en: "https://wagewatchers.com/en/feedback",
        nl: "https://wagewatchers.com/nl/feedback",
        fr: "https://wagewatchers.com/fr/feedback",
        de: "https://wagewatchers.com/de/feedback",
      },
    },
  };
}

export default async function FeedbackPage() {
  return <FeedbackClient />;
}
