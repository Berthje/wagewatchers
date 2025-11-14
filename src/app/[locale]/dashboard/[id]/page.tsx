import { formatCityDisplayForMetadata } from "@/lib/utils/format.utils";
import { db } from "@/lib/db";
import { salaryEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { EntryDetailClient } from "./entry-detail-client";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;

  const entry = await db
    .select()
    .from(salaryEntries)
    .where(eq(salaryEntries.id, Number.parseInt(id)))
    .limit(1);

  if (!entry[0]) {
    return {
      title: "Entry Not Found",
    };
  }

  // Create SEO-friendly title and description
  const jobTitle = entry[0].jobTitle || "Position";
  const sector = entry[0].sector || "";
  const country = entry[0].country || "";
  const city = entry[0].workCity || "";
  const salary = entry[0].grossSalary || entry[0].netSalary;

  const location = formatCityDisplayForMetadata(country, city, locale);
  const sectorText = sector ? ` in ${sector}` : "";
  const locationText = location ? ` - ${location}` : "";
  const title = `${jobTitle}${sectorText}${locationText} | WageWatchers`;

  const descriptionParts = [
    jobTitle,
    sector && `in ${sector}`,
    location && `located in ${location}`,
    salary && `earning ${salary} ${entry[0].currency || "EUR"}`,
    entry[0].workExperience && `with ${entry[0].workExperience} years experience`,
  ].filter(Boolean);

  const description = `Salary data for ${descriptionParts.join(
    ", "
  )}. View detailed compensation information on WageWatchers.`;

  return {
    title,
    description,
    keywords: [
      jobTitle.toLowerCase(),
      sector.toLowerCase(),
      country.toLowerCase(),
      city.toLowerCase(),
      "salary",
      "compensation",
      "job market",
      "wage data",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `https://wagewatchers.com/${locale}/dashboard/${id}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `https://wagewatchers.com/en/dashboard/${id}`,
      languages: {
        en: `https://wagewatchers.com/en/dashboard/${id}`,
        nl: `https://wagewatchers.com/nl/dashboard/${id}`,
        fr: `https://wagewatchers.com/fr/dashboard/${id}`,
        de: `https://wagewatchers.com/de/dashboard/${id}`,
        "x-default": `https://wagewatchers.com/en/dashboard/${id}`,
      },
    },
  };
}

export default async function EntryDetailPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string; id: string }>;
}>) {
  const { locale, id } = await params;

  const entry = await db
    .select()
    .from(salaryEntries)
    .where(eq(salaryEntries.id, Number.parseInt(id)))
    .limit(1);

  if (!entry[0]) {
    notFound();
  }

  return <EntryDetailClient entry={entry[0]} locale={locale} />;
}
