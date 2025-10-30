import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { EntryDetailClient } from "./entry-detail-client";

const prisma = new PrismaClient();

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
