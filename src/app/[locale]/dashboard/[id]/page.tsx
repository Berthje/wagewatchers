import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { EntryDetailClient } from "./entry-detail-client";
import { Metadata } from "next";

const prisma = new PrismaClient();

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
    const { locale, id } = await params;

    const entry = await prisma.salaryEntry.findUnique({
        where: { id: Number.parseInt(id) },
    });

    if (!entry) {
        return {
            title: "Entry Not Found",
        };
    }

    // Create SEO-friendly title and description
    const jobTitle = entry.jobTitle || "Position";
    const sector = entry.sector || "";
    const country = entry.country || "";
    const city = entry.workCity || "";
    const salary = entry.grossSalary || entry.netSalary;

    const location = [city, country].filter(Boolean).join(", ");
    const sectorText = sector ? ` in ${sector}` : "";
    const locationText = location ? ` - ${location}` : "";
    const title = `${jobTitle}${sectorText}${locationText} | WageWatchers`;

    const descriptionParts = [
        jobTitle,
        sector && `in ${sector}`,
        location && `located in ${location}`,
        salary && `earning ${salary} ${entry.currency || "EUR"}`,
        entry.workExperience && `with ${entry.workExperience} years experience`,
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
            canonical: `https://wagewatchers.com/${locale}/dashboard/${id}`,
        },
    };
}

export default async function EntryDetailPage({
    params,
}: Readonly<{
    params: Promise<{ locale: string; id: string }>;
}>) {
    const { locale, id } = await params;

    const entry = await prisma.salaryEntry.findUnique({
        where: { id: Number.parseInt(id) },
    });

    if (!entry) {
        notFound();
    }

    return <EntryDetailClient entry={entry} locale={locale} />;
}
