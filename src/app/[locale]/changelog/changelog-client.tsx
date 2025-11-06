"use client";

import { useTranslations } from "next-intl";
import NewsletterSignup from "@/components/newsletter-signup";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

interface ChangelogClientProps {
  locale: string;
  changelogEntries: ChangelogEntry[];
}

export function ChangelogClient({ locale, changelogEntries }: Readonly<ChangelogClientProps>) {
  const t = useTranslations("changelog");

  return (
    <div className="bg-linear-to-b from-stone-950 via-stone-900 to-stone-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back to Homepage Button */}
        <div className="mb-6">
          <Link href={`/${locale}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("backToHome")}
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">{t("description")}</p>
        </div>

        <div className="space-y-8">
          {changelogEntries.map((entry) => (
            <div key={entry.version} className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  {t("version")} {entry.version}
                </h2>
                <span className="text-sm text-muted-foreground">{entry.date}</span>
              </div>
              <ul className="space-y-2">
                {entry.changes.map((change) => (
                  <li key={change} className="flex items-start">
                    <span className="text-green-500 mr-2">{t("bullet")}</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="text-xl font-semibold mb-2">{t("stayUpdated")}</h3>
          <p className="text-muted-foreground mb-4">{t("newsletterPrompt")}</p>
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
}
