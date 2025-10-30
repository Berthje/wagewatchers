import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import EditEntryClient from "./edit-client";

interface EditEntryPageProps {
    readonly params: Promise<{
        locale: string;
        id: string;
    }>;
}

export async function generateMetadata({
    params,
}: EditEntryPageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "edit" });

    return {
        title: t("meta.title"),
        description: t("meta.description"),
    };
}

export default async function EditEntryPage() {
    return <EditEntryClient />;
}
