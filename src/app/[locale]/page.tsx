import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedWorldMap } from "@/components/animated-world-map";
import { Navbar } from "@/components/navbar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const title = `${t("title.salary")} ${t("title.transparency")} - WageWatchers`;
  const description = t("subtitle");

  return {
    title,
    description,
    keywords: [
      "salary transparency",
      "European salaries",
      "compensation data",
      "job market",
      "career insights",
    ],
    openGraph: {
      title,
      description,
      url: `https://wagewatchers.com/${locale}`,
      siteName: "WageWatchers",
      locale: locale === "en" ? "en_US" : `${locale}_${locale.toUpperCase()}`,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${t("title.salary")} ${t("title.transparency")}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: `https://wagewatchers.com/en`,
      languages: {
        en: "https://wagewatchers.com/en",
        nl: "https://wagewatchers.com/nl",
        fr: "https://wagewatchers.com/fr",
        de: "https://wagewatchers.com/de",
        "x-default": "https://wagewatchers.com/en",
      },
    },
  };
}

// Illustrative preview of the kind of entries the community shares.
// Clearly labelled as a sample in the UI — not live figures.
const SAMPLE_ENTRIES = [
  { role: "Software Engineer", place: "Brussels", amount: "€4,100", delay: "0.15s" },
  { role: "Registered Nurse", place: "Antwerp", amount: "€2,950", delay: "0.3s" },
  { role: "Secondary Teacher", place: "Ghent", amount: "€3,150", delay: "0.45s" },
  { role: "Data Analyst", place: "Leuven", amount: "€3,600", delay: "0.6s" },
];

const FEATURE_KEYS = ["multiCountry", "privacy", "analysis"] as const;

async function HomeContent({ locale }: Readonly<{ locale: string }>) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="lp-ledger relative min-h-screen overflow-hidden bg-background text-foreground">
      <Navbar />

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-16 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Left — the pitch */}
            <div className="lg:col-span-7">
              <p
                className="lp-rise mb-6 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
                style={{ animationDelay: "0.05s" }}
              >
                <span className="inline-block h-1.5 w-1.5 bg-brand" aria-hidden="true" />
                {t("eyebrow")}
              </p>

              <h1
                className="lp-rise font-display text-[clamp(2.6rem,7vw,5.25rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-foreground"
                style={{ animationDelay: "0.12s" }}
              >
                {t("title.salary")}{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="relative">{t("title.transparency")}</span>
                  <span className="lp-marker" aria-hidden="true" />
                </span>
              </h1>

              <p
                className="lp-rise mt-7 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
                style={{ animationDelay: "0.2s" }}
              >
                {t("subtitle")}
              </p>

              <div
                className="lp-rise mt-9 flex flex-col gap-3 sm:flex-row"
                style={{ animationDelay: "0.28s" }}
              >
                <Link href={`/${locale}/dashboard`} className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 w-full px-7 text-base font-semibold sm:w-auto">
                    {t("exploreData")}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/add`} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full px-7 text-base font-medium sm:w-auto"
                  >
                    {t("shareSalary")}
                    <ArrowUpRight className="size-4 text-brand" />
                  </Button>
                </Link>
              </div>

              <ul
                className="lp-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground"
                style={{ animationDelay: "0.36s" }}
              >
                {[t("trust.anonymous"), t("trust.free"), t("trust.community")].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-brand" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — the signature: a payslip with redacted figures that reveal */}
            <div className="lg:col-span-5">
              <div
                className="lp-rise rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/10 backdrop-blur-sm sm:p-6 dark:shadow-black/40"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="font-display text-sm font-semibold text-foreground">
                    {t("sample.title")}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    EUR · NET/MO
                  </span>
                </div>

                <ul className="divide-y divide-border">
                  {SAMPLE_ENTRIES.map((entry) => (
                    <li key={entry.role} className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{entry.role}</p>
                        <p className="font-mono text-xs text-muted-foreground">{entry.place}</p>
                      </div>
                      <span className="lp-reveal shrink-0 font-mono text-2xl font-medium tracking-tight text-foreground md:text-[1.65rem]">
                        <span>
                          {entry.amount}
                          <span className="ml-0.5 text-xs text-muted-foreground">/mo</span>
                        </span>
                        <span
                          className="lp-reveal__bar"
                          style={{ animationDelay: entry.delay }}
                          aria-hidden="true"
                        />
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {t("sample.caption")}
                  </span>
                  <Link
                    href={`/${locale}/dashboard`}
                    className="group inline-flex items-center gap-1 font-mono text-[11px] font-medium text-brand transition-colors hover:opacity-80"
                  >
                    {t("exploreData")}
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features — a ledger, not generic cards */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <p className="mb-10 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("features.eyebrow")}
            </p>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
              {FEATURE_KEYS.map((key) => (
                <div key={key} className="bg-background p-7 md:p-8">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
                    {t(`features.${key}.label`)}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`features.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing — European coverage + final call */}
        <section className="relative overflow-hidden border-t border-border">
          <div
            className="pointer-events-none absolute inset-0 opacity-60 mask-[radial-gradient(125%_125%_at_50%_25%,black,transparent_70%)]"
            aria-hidden="true"
          >
            <AnimatedWorldMap colorClassName="text-foreground/15" />
          </div>
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--brand)_12%,transparent),transparent)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
            <h2 className="font-display text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-tight tracking-[-0.02em] text-foreground">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              {t("cta.subtitle")}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/${locale}/add`} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-12 w-full bg-brand px-8 text-base font-semibold text-brand-foreground hover:bg-brand/90 sm:w-auto"
                >
                  {t("shareSalary")}
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard`} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full px-8 text-base font-medium sm:w-auto"
                >
                  {t("exploreData")}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-10 text-center">
            <p className="font-mono text-xs text-muted-foreground">{t("footer")}</p>
            <p className="text-xs text-muted-foreground">
              Made with ❤️ for the community ·{" "}
              <a
                href="https://github.com/Berthje/wagewatchers"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                View on GitHub
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default async function Home({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}
