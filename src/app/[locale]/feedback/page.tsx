import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FeedbackClient from "./feedback-client";

interface FeedbackPageProps {
    readonly params: Promise<{
        locale: string;
    }>;
}

export async function generateMetadata({
    params,
}: FeedbackPageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "feedback" });

    return {
        title: t("title"),
        description: t("subtitle"),
    };
}

export default async function FeedbackPage() {
    return <FeedbackClient />;
}
