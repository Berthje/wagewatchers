"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SalaryEntry } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Lock } from "lucide-react";
import {
    getEntryToken,
    isEntryEditable,
    verifyOwnerToken,
} from "@/lib/entry-ownership";

export default function EditEntryClient() {
    const params = useParams();
    const locale = params.locale as string;
    const entryId = Number.parseInt(params.id as string);
    const router = useRouter();
    const t = useTranslations("edit");
    const tNav = useTranslations("nav");

    const navTranslations = {
        dashboard: tNav("dashboard"),
        statistics: tNav("statistics"),
        feedback: tNav("feedback"),
        status: tNav("status"),
        donate: tNav("donate"),
        addEntry: tNav("addEntry"),
    };

    const [entry, setEntry] = useState<SalaryEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        const loadEntry = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Check if we have the token
                const token = getEntryToken(entryId);
                if (!token) {
                    setError(t("errors.noToken"));
                    setIsLoading(false);
                    return;
                }

                // Fetch the entry
                const res = await fetch(`/api/entries/${entryId}`);
                if (!res.ok) {
                    setError(t("errors.notFound"));
                    setIsLoading(false);
                    return;
                }

                const data: SalaryEntry = await res.json();

                // Verify ownership using proper token verification
                if (!verifyOwnerToken(token, entryId, data.ownerToken, data.editableUntil)) {
                    setError(t("errors.notOwner"));
                    setIsLoading(false);
                    return;
                }

                // Check if editable
                if (!isEntryEditable(data.editableUntil)) {
                    setError(t("errors.expired"));
                    setIsLoading(false);
                    return;
                }

                setEntry(data);
                setCanEdit(true);
            } catch (err) {
                console.error("Error loading entry:", err);
                setError(t("errors.generic"));
            } finally {
                setIsLoading(false);
            }
        };

        loadEntry();
    }, [entryId, t]);

    // Redirect to add page with entry ID for editing when entry is loaded and editable
    useEffect(() => {
        if (entry && canEdit && !isLoading) {
            router.push(`/${locale}/add?edit=${entryId}`);
        }
    }, [entry, canEdit, isLoading, router, locale, entryId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-900">
                <Navbar locale={locale} translations={navTranslations} />
                <main className="container mx-auto px-4 py-8">
                    <LoadingSpinner
                        message={t("loading")}
                        fullScreen={false}
                        size="lg"
                    />
                </main>
            </div>
        );
    }

    if (error || !entry || !canEdit) {
        return (
            <div className="min-h-screen bg-stone-900">
                <Navbar locale={locale} translations={navTranslations} />
                <main className="container mx-auto px-4 py-8 max-w-2xl">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Lock className="mx-auto h-12 w-12 text-red-500 mb-4" />
                            <h2 className="text-2xl font-bold text-stone-100 mb-2">
                                {t("errorTitle")}
                            </h2>
                            <p className="text-stone-400 mb-6">
                                {error || t("errors.generic")}
                            </p>
                            <div className="space-x-4">
                                <Button
                                    variant="outline"
                                    onClick={() => router.back()}
                                >
                                    {t("goBack")}
                                </Button>
                                <Button
                                    onClick={() =>
                                        router.push(`/${locale}/my-entries`)
                                    }
                                >
                                    {t("goToMyEntries")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    // Redirecting to edit form
    return (
        <div className="min-h-screen bg-stone-900">
            <Navbar locale={locale} translations={navTranslations} />
            <main className="container mx-auto px-4 py-8">
                <LoadingSpinner
                    message={t("redirecting")}
                    fullScreen={false}
                    size="lg"
                />
            </main>
        </div>
    );
}