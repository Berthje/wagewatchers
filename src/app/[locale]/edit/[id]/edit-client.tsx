"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { SalaryEntry } from "@/lib/db/schema";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Lock } from "lucide-react";
import { getEntryToken, isEntryEditable, verifyOwnerToken } from "@/lib/entry-ownership";
import { logError } from "@/lib/logger";

export default function EditEntryClient() {
  const params = useParams();
  const locale = params.locale as string;
  const entryId = Number.parseInt(params.id as string);
  const router = useRouter();
  const t = useTranslations("edit");

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
        logError("Error loading entry:", err, { entryId });
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
      <PageShell width="sm">
        <LoadingSpinner message={t("loading")} fullScreen={false} size="lg" />
      </PageShell>
    );
  }

  if (error || !entry || !canEdit) {
    return (
      <PageShell width="sm">
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <Lock className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-2xl font-bold text-foreground">{t("errorTitle")}</h2>
            <p className="mb-6 text-muted-foreground">{error || t("errors.generic")}</p>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => router.push(`/${locale}/my-entries`)}>
                {t("goBack")}
              </Button>
              <Button onClick={() => router.push(`/${locale}/my-entries`)}>
                {t("goToMyEntries")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // Redirecting to edit form
  return (
    <PageShell width="sm">
      <LoadingSpinner message={t("redirecting")} fullScreen={false} size="lg" />
    </PageShell>
  );
}
