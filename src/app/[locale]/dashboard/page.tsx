import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const entryCount = await db
    .select({ count: count() })
    .from(salaryEntries)
    .where(eq(salaryEntries.reviewStatus, "APPROVED"));

  const title = t("title");
  const description = t("subtitle", { count: entryCount[0].count });

  return {
    title,
    description,
    keywords: [
      "salary data",
      "compensation dashboard",
      "job salaries",
      "market rates",
      "salary comparison",
    ],
    openGraph: {
      title,
      description,
      url: `https://wagewatchers.com/${locale}/dashboard`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://wagewatchers.com/${locale}/dashboard`,
      languages: {
        en: "https://wagewatchers.com/en/dashboard",
        nl: "https://wagewatchers.com/nl/dashboard",
        fr: "https://wagewatchers.com/fr/dashboard",
        de: "https://wagewatchers.com/de/dashboard",
      },
    },
  };
}

export default async function Dashboard({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return (
    <Suspense fallback={null}>
      <DashboardClient locale={locale} />
    </Suspense>
  );
}
