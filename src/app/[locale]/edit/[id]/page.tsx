import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import EditEntryClient from "./edit-client";

interface EditEntryPageProps {
  readonly params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: EditEntryPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "edit" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `https://wagewatchers.com/${locale}/edit/${id}`,
      languages: {
        en: `https://wagewatchers.com/en/edit/${id}`,
        nl: `https://wagewatchers.com/nl/edit/${id}`,
        fr: `https://wagewatchers.com/fr/edit/${id}`,
        de: `https://wagewatchers.com/de/edit/${id}`,
      },
    },
  };
}

export default async function EditEntryPage() {
  return <EditEntryClient />;
}
