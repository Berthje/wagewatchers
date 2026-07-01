"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Coffee,
  Heart,
  Server,
  Database,
  Code,
  Sparkles,
  Share2,
  FileText,
  MessageSquare,
  ArrowLeft,
  ExternalLink,
  Globe,
  Users,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { logError } from "@/lib/logger";

export default function DonateClient() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("donate");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [donationType, setDonationType] = useState<"traditional" | "crypto">("traditional");

  // Extract current locale from pathname
  const currentLocale = pathname.split("/")[1] || "en";

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      logError("Failed to copy address", err);
    }
  };

  const benefits = [
    {
      icon: Server,
      title: t("benefits.hosting.title"),
      description: t("benefits.hosting.description"),
      color: "text-blue-400",
    },
    {
      icon: Database,
      title: t("benefits.database.title"),
      description: t("benefits.database.description"),
      color: "text-green-400",
    },
    {
      icon: Code,
      title: t("benefits.development.title"),
      description: t("benefits.development.description"),
      color: "text-purple-400",
    },
    {
      icon: Heart,
      title: t("benefits.free.title"),
      description: t("benefits.free.description"),
      color: "text-brand",
    },
  ];

  const otherWays = [
    {
      icon: Share2,
      text: t("share"),
      color: "bg-blue-900/30 text-blue-400",
      action: () => {
        if (navigator.share) {
          navigator.share({
            title: t("shareTitle"),
            text: t("shareText"),
            url: globalThis.location.origin,
          });
        } else {
          // Fallback: copy URL to clipboard
          navigator.clipboard.writeText(globalThis.location.origin);
        }
      },
    },
    {
      icon: FileText,
      text: t("contribute"),
      color: "bg-green-900/30 text-green-400",
      action: () => router.push(`/${currentLocale}/add`),
    },
    {
      icon: MessageSquare,
      text: t("feedback"),
      color: "bg-purple-900/30 text-purple-400",
      action: () => router.push(`/${currentLocale}/feedback`),
    },
  ];

  return (
    <PageShell width="md">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/${currentLocale}`)}
        className="mb-6 -ml-4 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("goBack")}</span>
      </Button>

      {/* Header with Coffee Animation */}
      <div className="mb-4 text-center">
        <div className="mb-4 inline-block animate-bounce">
          <Coffee className="h-20 w-20 text-brand" strokeWidth={1.5} />
        </div>
      </div>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        className="text-center [&_h1]:mx-auto [&_p]:mx-auto [&>div]:flex-col [&>div]:items-center"
      />

      {/* Main Description */}
      <Card className="mb-8 border-2 border-brand/30 shadow-lg">
        <CardContent>
          <p className="text-lg leading-relaxed text-muted-foreground">{t("description")}</p>
        </CardContent>
      </Card>

      {/* Why Donate Section */}
      <div className="mb-12">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
          <Sparkles className="h-6 w-6 text-brand" />
          {t("whyDonate")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {benefits.map((benefit) => (
            <Card
              key={benefit.title}
              className="border-l-4 border-l-brand transition-shadow duration-300 hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                  <span className="text-lg">{benefit.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Donation Options */}
      <div className="mb-8">
        <div className="mb-8 text-center">
          <h3 className="mb-3 text-2xl font-bold text-foreground">{t("thankYou")}</h3>
          <p className="mx-auto max-w-2xl text-muted-foreground">{t("thankYouMessage")}</p>
        </div>

        {/* Donation Type Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center rounded-lg border border-border bg-card/80 p-1 backdrop-blur-sm">
            <button
              onClick={() => setDonationType("traditional")}
              className={`cursor-pointer rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
                donationType === "traditional"
                  ? "bg-brand text-brand-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("traditional")}
            </button>
            <button
              onClick={() => setDonationType("crypto")}
              className={`cursor-pointer rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
                donationType === "crypto"
                  ? "bg-brand text-brand-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("crypto")}
            </button>
          </div>
        </div>

        {/* Traditional Donations */}
        {donationType === "traditional" && (
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {/* Buy Me a Coffee - Featured */}
            <a
              href="https://buymeacoffee.com/laytonberth"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border-2 border-brand/30 bg-brand/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-brand hover:shadow-xl"
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300 group-hover:scale-110">
                  <Coffee className="h-7 w-7 text-brand" />
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-1 text-lg font-bold text-foreground">{t("buyMeCoffee")}</div>
                  <div className="text-sm text-muted-foreground">{t("oneTimeSupport")}</div>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-brand" />
              </div>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-brand/0 via-brand/5 to-brand/0 transition-transform duration-1000 group-hover:translate-x-full" />
            </a>

            {/* PayPal */}
            <a
              href="https://paypal.me/berthje"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border-2 border-blue-900/50 bg-linear-to-br from-blue-950/30 to-indigo-950/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-600 hover:shadow-xl"
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-7 w-7 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.067 8.478c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-1.735 1.904.047 2.276 1.103 2.124 2.157-.156 1.055-.705 2.026-1.401 2.926z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-1 text-lg font-bold text-foreground">{t("paypal")}</div>
                  <div className="text-sm text-muted-foreground">{t("securePayment")}</div>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-blue-400" />
              </div>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 transition-transform duration-1000 group-hover:translate-x-full" />
            </a>

            {/* Ko-fi */}
            <a
              href="https://ko-fi.com/berthje"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border-2 border-red-900/50 bg-linear-to-br from-red-950/30 to-pink-950/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-red-600 hover:shadow-xl"
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-7 w-7 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-1.735 1.904.047 2.276 1.103 2.124 2.157-.156 1.055-.705 2.026-1.401 2.926z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-1 text-lg font-bold text-foreground">{t("kofi")}</div>
                  <div className="text-sm text-muted-foreground">{t("supportWithKofi")}</div>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-red-400" />
              </div>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-red-400/0 via-red-400/5 to-red-400/0 transition-transform duration-1000 group-hover:translate-x-full" />
            </a>

            {/* GitHub Sponsors */}
            <a
              href="https://github.com/sponsors/berthje"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border-2 border-purple-900/50 bg-linear-to-br from-purple-950/30 to-violet-950/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-purple-600 hover:shadow-xl"
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-7 w-7 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-1 text-lg font-bold text-foreground">{t("github")}</div>
                  <div className="text-sm text-muted-foreground">{t("monthlySponsorship")}</div>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-purple-400" />
              </div>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-purple-400/0 via-purple-400/5 to-purple-400/0 transition-transform duration-1000 group-hover:translate-x-full" />
            </a>
          </div>
        )}

        {/* Crypto Donations */}
        {donationType === "crypto" && (
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
            {/* Ethereum */}
            <div className="group relative overflow-hidden rounded-xl border-2 border-blue-900/50 bg-linear-to-br from-blue-950/30 to-indigo-950/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-600 hover:shadow-xl md:col-span-2">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-7 w-7 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-lg font-bold text-foreground">{t("ethereum")}</div>
                    <div className="text-sm break-all text-muted-foreground">
                      0xA7D90734fB2B0aa3769DbCa79d496ec1939cd272
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{t("ethereumNote")}</div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard("0xA7D90734fB2B0aa3769DbCa79d496ec1939cd272")}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-900/30 px-4 py-2 text-blue-200 transition-colors hover:bg-blue-900/50"
                >
                  {copiedAddress === "0xA7D90734fB2B0aa3769DbCa79d496ec1939cd272" ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t("addressCopied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t("copyAddress")}
                    </>
                  )}
                </button>
              </div>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 transition-transform duration-1000 group-hover:translate-x-full" />
            </div>

            {/* Bitcoin */}
            <div className="group relative overflow-hidden rounded-xl border-2 border-brand/30 bg-brand/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-brand hover:shadow-xl">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300 group-hover:scale-110">
                    <svg
                      className="h-10 w-10"
                      viewBox="0 0 64 64"
                      xmlns="http://www.w3.org/2000/svg"
                      height="64"
                      width="64"
                      version="1.1"
                    >
                      <g transform="translate(0.00630876,-0.00301984)">
                        <path
                          fill="#f7931a"
                          d="m63.033,39.744c-4.274,17.143-21.637,27.576-38.782,23.301-17.138-4.274-27.571-21.638-23.295-38.78,4.272-17.145,21.635-27.579,38.775-23.305,17.144,4.274,27.576,21.64,23.302,38.784z"
                        />
                        <path
                          fill="#FFF"
                          d="m46.103,27.444c0.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-0.875-1.4,5.616c-0.923-0.23-1.871-0.447-2.813-0.662l1.41-5.653-3.509-0.875-1.439,5.766c-0.764-0.174-1.514-0.346-2.242-0.527l0.004-0.018-4.842-1.209-0.934,3.75s2.605,0.597,2.55,0.634c1.422,0.355,1.679,1.296,1.636,2.042l-1.638,6.571c0.098,0.025,0.225,0.061,0.365,0.117-0.117-0.029-0.242-0.061-0.371-0.092l-2.296,9.205c-0.174,0.432-0.615,1.08-1.609,0.834,0.035,0.051-2.552-0.637-2.552-0.637l-1.743,4.019,4.569,1.139c0.85,0.213,1.683,0.436,2.503,0.646l-1.453,5.834,3.507,0.875,1.439-5.772c0.958,0.26,1.888,0.5,2.798,0.726l-1.434,5.745,3.511,0.875,1.453-5.823c5.987,1.133,10.489,0.676,12.384-4.739,1.527-4.36-0.076-6.875-3.226-8.515,2.294-0.529,4.022-2.038,4.483-5.155zm-8.022,11.249c-1.085,4.36-8.426,2.003-10.806,1.412l1.928-7.729c2.38,0.594,10.012,1.77,8.878,6.317zm1.086-11.312c-0.99,3.966-7.1,1.951-9.082,1.457l1.748-7.01c1.982,0.494,8.365,1.416,7.334,5.553z"
                        />
                      </g>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-lg font-bold text-foreground">{t("bitcoin")}</div>
                    <div className="text-sm break-all text-muted-foreground">
                      bc1q0w2prmyzzfed985pwausvuktaya5gq0f88cevh
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard("bc1q0w2prmyzzfed985pwausvuktaya5gq0f88cevh")}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand/10 px-4 py-2 text-brand transition-colors hover:bg-brand/20"
                >
                  {copiedAddress === "bc1q0w2prmyzzfed985pwausvuktaya5gq0f88cevh" ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t("addressCopied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t("copyAddress")}
                    </>
                  )}
                </button>
              </div>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-brand/0 via-brand/5 to-brand/0 transition-transform duration-1000 group-hover:translate-x-full" />
            </div>

            {/* Solana */}
            <div className="group relative overflow-hidden rounded-xl border-2 border-purple-900/50 bg-linear-to-br from-purple-950/30 to-violet-950/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-purple-600 hover:shadow-xl">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card shadow-md transition-transform duration-300 group-hover:scale-110">
                    <svg
                      className="h-8 w-8 text-purple-400"
                      version="1.1"
                      id="Layer_1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      x="0px"
                      y="0px"
                      viewBox="0 0 397.7 311.7"
                      xmlSpace="preserve"
                    >
                      <style type="text/css">
                        {`.st0{fill:url(#SVGID_1_);}
                                                    .st1{fill:url(#SVGID_2_);}
                                                    .st2{fill:url(#SVGID_3_);}`}
                      </style>
                      <linearGradient
                        id="SVGID_1_"
                        gradientUnits="userSpaceOnUse"
                        x1="360.8791"
                        y1="351.4553"
                        x2="141.213"
                        y2="-69.2936"
                        gradientTransform="matrix(1 0 0 -1 0 314)"
                      >
                        <stop offset="0" style={{ stopColor: "#00FFA3" }} />
                        <stop offset="1" style={{ stopColor: "#DC1FFF" }} />
                      </linearGradient>
                      <path
                        className="st0"
                        d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5  c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"
                      />
                      <linearGradient
                        id="SVGID_2_"
                        gradientUnits="userSpaceOnUse"
                        x1="264.8291"
                        y1="401.6014"
                        x2="45.163"
                        y2="-19.1475"
                        gradientTransform="matrix(1 0 0 -1 0 314)"
                      >
                        <stop offset="0" style={{ stopColor: "#00FFA3" }} />
                        <stop offset="1" style={{ stopColor: "#DC1FFF" }} />
                      </linearGradient>
                      <path
                        className="st1"
                        d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5  c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"
                      />
                      <linearGradient
                        id="SVGID_3_"
                        gradientUnits="userSpaceOnUse"
                        x1="312.5484"
                        y1="376.688"
                        x2="92.8822"
                        y2="-44.061"
                        gradientTransform="matrix(1 0 0 -1 0 314)"
                      >
                        <stop offset="0" style={{ stopColor: "#00FFA3" }} />
                        <stop offset="1" style={{ stopColor: "#DC1FFF" }} />
                      </linearGradient>
                      <path
                        className="st2"
                        d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4  c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-lg font-bold text-foreground">{t("solana")}</div>
                    <div className="text-sm break-all text-muted-foreground">
                      64Vp7Qr3ibBRznvWAvgxkVstipSouYwRwxEQs8GcZrg9
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard("64Vp7Qr3ibBRznvWAvgxkVstipSouYwRwxEQs8GcZrg9")}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-purple-900/30 px-4 py-2 text-purple-200 transition-colors hover:bg-purple-900/50"
                >
                  {copiedAddress === "64Vp7Qr3ibBRznvWAvgxkVstipSouYwRwxEQs8GcZrg9" ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t("addressCopied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t("copyAddress")}
                    </>
                  )}
                </button>
              </div>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-purple-400/0 via-purple-400/5 to-purple-400/0 transition-transform duration-1000 group-hover:translate-x-full" />
            </div>
          </div>
        )}
      </div>

      {/* Other Ways to Support */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-foreground">{t("otherWays")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {otherWays.map((way) => (
            <Card
              key={way.text}
              className="group cursor-pointer transition-all duration-300 hover:border-foreground/20 hover:shadow-lg"
              onClick={way.action}
            >
              <CardContent className="text-center">
                <div
                  className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full ${way.color} transition-all duration-300 group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-offset-background`}
                >
                  <way.icon className="h-6 w-6 transition-all duration-300 group-hover:brightness-110" />
                </div>
                <p className="font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                  {way.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <Card className="border-border bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">{t("connect")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-4">
            {/* Reddit */}
            <Button
              asChild
              variant="outline"
              className="transition-colors hover:bg-brand/10 hover:text-brand"
            >
              <a
                href="https://reddit.com/user/berthjettv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {t("socials.reddit")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>

            {/* Portfolio */}
            <Button
              asChild
              variant="outline"
              className="transition-colors hover:bg-blue-900/30 hover:text-blue-400"
            >
              <a
                href="https://www.laytonberth.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {t("socials.portfolio")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="mt-16 px-4 text-center md:mt-24">
        <p className="mb-2 text-sm text-muted-foreground">{t("footerCommunity")}</p>
        <p className="text-xs text-muted-foreground">
          {t("footerMadeWith")}{" "}
          <a
            href="https://github.com/Berthje/wagewatchers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground underline transition-colors hover:text-foreground"
          >
            {t("footerViewOnGithub")}
          </a>
        </p>
      </footer>
    </PageShell>
  );
}
