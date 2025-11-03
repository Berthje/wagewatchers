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

export default function DonatePage() {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations("donate");
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
    const [donationType, setDonationType] = useState<'traditional' | 'crypto'>('traditional');

    // Extract current locale from pathname
    const currentLocale = pathname.split('/')[1] || 'en';

    const copyToClipboard = async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            setCopiedAddress(address);
            setTimeout(() => setCopiedAddress(null), 2000);
        } catch (err) {
            console.error('Failed to copy address:', err);
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
            color: "text-orange-400",
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
                        title: 'WageWatchers - European Salary Transparency Platform',
                        text: 'Check out WageWatchers - Community-driven salary transparency across European markets!',
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
        <div className="min-h-screen bg-linear-to-b from-stone-950 via-stone-900 to-stone-950">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/${currentLocale}`)}
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-orange-400 transition-colors mb-6 -ml-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{t("goBack")}</span>
                </Button>

                {/* Header with Coffee Animation */}
                <div className="text-center mb-12">
                    <div className="inline-block mb-4 animate-bounce">
                        <Coffee
                            className="h-20 w-20 text-orange-500"
                            strokeWidth={1.5}
                        />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-stone-100 mb-4">
                        {t("title")}
                    </h1>
                    <p className="text-xl text-stone-400 mb-2">
                        {t("subtitle")}
                    </p>
                </div>

                {/* Main Description */}
                <Card className="mb-8 border-2 border-orange-900/50 shadow-lg">
                    <CardContent>
                        <p className="text-lg text-stone-300 leading-relaxed">
                            {t("description")}
                        </p>
                    </CardContent>
                </Card>

                {/* Why Donate Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-stone-100 mb-6 flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-orange-500" />
                        {t("whyDonate")}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {benefits.map((benefit) => (
                            <Card
                                key={benefit.title}
                                className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-orange-600"
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <benefit.icon
                                            className={`h-6 w-6 ${benefit.color}`}
                                        />
                                        <span className="text-lg">
                                            {benefit.title}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-stone-400">
                                        {benefit.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Donation Options */}
                <div className="mb-8">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-stone-100 mb-3">
                            {t("thankYou")}
                        </h3>
                        <p className="text-stone-300 max-w-2xl mx-auto">
                            {t("thankYouMessage")}
                        </p>
                    </div>

                    {/* Donation Type Toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center p-1 bg-stone-800/50 rounded-lg border border-stone-700">
                            <button
                                onClick={() => setDonationType('traditional')}
                                className={`cursor-pointer px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${donationType === 'traditional'
                                    ? 'bg-orange-600 text-white shadow-lg'
                                    : 'text-stone-400 hover:text-stone-200'
                                    }`}
                            >
                                {t("traditional")}
                            </button>
                            <button
                                onClick={() => setDonationType('crypto')}
                                className={`cursor-pointer px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${donationType === 'crypto'
                                    ? 'bg-orange-600 text-white shadow-lg'
                                    : 'text-stone-400 hover:text-stone-200'
                                    }`}
                            >
                                {t("crypto")}
                            </button>
                        </div>
                    </div>

                    {/* Traditional Donations */}
                    {donationType === 'traditional' && (
                        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                            {/* Buy Me a Coffee - Featured */}
                            <a
                                href="https://buymeacoffee.com/laytonberth"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden rounded-xl border-2 border-orange-900/50 bg-linear-to-br from-orange-950/30 to-yellow-950/30 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-orange-600"
                            >
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="shrink-0 w-14 h-14 rounded-full bg-stone-900 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Coffee className="h-7 w-7 text-orange-400" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-lg text-stone-100 mb-1">
                                            {t("buyMeCoffee")}
                                        </div>
                                        <div className="text-sm text-stone-400">
                                            One-time support
                                        </div>
                                    </div>
                                    <ExternalLink className="h-5 w-5 text-stone-600 group-hover:text-orange-400 transition-colors" />
                                </div>
                                <div className="absolute inset-0 bg-linear-to-r from-orange-400/0 via-orange-400/5 to-orange-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </a>

                            {/* PayPal */}
                            <a
                                href="https://paypal.me/berthje"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden rounded-xl border-2 border-blue-900/50 bg-linear-to-br from-blue-950/30 to-indigo-950/30 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-600"
                            >
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="shrink-0 w-14 h-14 rounded-full bg-stone-900 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg
                                            className="h-7 w-7 text-blue-400"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 01-.794.679H7.72a.483.483 0 01-.476-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z" />
                                            <path d="M2.697 21.432a.483.483 0 01-.476-.558L4.623 4.856C4.695 4.384 5.097 4.027 5.58 4.027h5.693c1.918 0 3.23.398 3.952 1.158.71.75 1.026 1.884.94 3.368l-.013.218v.58l.465.264c.395.216.713.486.946.802.375.513.594 1.156.649 1.906.058.75-.02 1.598-.23 2.516-.82 3.56-3.64 5.284-8.375 5.284H8.91a1.112 1.112 0 00-1.098.934l-.028.15-.948 6.01-.027.14z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-lg text-stone-100 mb-1">
                                            {t("paypal")}
                                        </div>
                                        <div className="text-sm text-stone-400">
                                            Secure payment
                                        </div>
                                    </div>
                                    <ExternalLink className="h-5 w-5 text-stone-600 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <div className="absolute inset-0 bg-linear-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </a>

                            {/* Ko-fi */}
                            <a
                                href="https://ko-fi.com/berthje"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden rounded-xl border-2 border-red-900/50 bg-linear-to-br from-red-950/30 to-pink-950/30 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-red-600"
                            >
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="shrink-0 w-14 h-14 rounded-full bg-stone-900 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg
                                            className="h-7 w-7 text-red-400"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-1.735 1.904.047 2.276 1.103 2.124 2.157-.156 1.055-.705 2.026-1.401 2.926z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-lg text-stone-100 mb-1">
                                            {t("kofi")}
                                        </div>
                                        <div className="text-sm text-stone-400">
                                            Support with Ko-fi
                                        </div>
                                    </div>
                                    <ExternalLink className="h-5 w-5 text-stone-600 group-hover:text-red-400 transition-colors" />
                                </div>
                                <div className="absolute inset-0 bg-linear-to-r from-red-400/0 via-red-400/5 to-red-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </a>

                            {/* GitHub Sponsors */}
                            <a
                                href="https://github.com/sponsors/berthje"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden rounded-xl border-2 border-purple-900/50 bg-linear-to-br from-purple-950/30 to-violet-950/30 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-purple-600"
                            >
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="shrink-0 w-14 h-14 rounded-full bg-stone-900 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg
                                            className="h-7 w-7 text-purple-400"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-lg text-stone-100 mb-1">
                                            {t("github")}
                                        </div>
                                        <div className="text-sm text-stone-400">
                                            Monthly sponsorship
                                        </div>
                                    </div>
                                    <ExternalLink className="h-5 w-5 text-stone-600 group-hover:text-purple-400 transition-colors" />
                                </div>
                                <div className="absolute inset-0 bg-linear-to-r from-purple-400/0 via-purple-400/5 to-purple-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </a>
                        </div>
                    )}

                    {/* Crypto Donations */}
                    {donationType === 'crypto' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                            {/* Ethereum */}
                            <div className="md:col-span-2 group relative overflow-hidden rounded-xl border-2 border-blue-900/50 bg-linear-to-br from-blue-950/30 to-indigo-950/30 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-600">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="shrink-0 w-14 h-14 rounded-full bg-stone-900 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <svg
                                                className="h-7 w-7 text-blue-400"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-lg text-stone-100 mb-1">
                                                {t("ethereum")}
                                            </div>
                                            <div className="text-sm text-stone-400 break-all">
                                                0xA7D90734fB2B0aa3769DbCa79d496ec1939cd272
                                            </div>
                                            <div className="text-xs text-stone-500 mt-1">
                                                {t("ethereumNote")}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard('0xA7D90734fB2B0aa3769DbCa79d496ec1939cd272')}
                                        className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-900/30 text-blue-200 rounded-lg hover:bg-blue-900/50 transition-colors"
                                    >
                                        {copiedAddress === '0xA7D90734fB2B0aa3769DbCa79d496ec1939cd272' ? (
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
                                <div className="absolute inset-0 bg-linear-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>

                            {/* Bitcoin */}
                            <div className="group relative overflow-hidden rounded-xl border-2 border-orange-900/50 bg-linear-to-br from-orange-950/30 to-yellow-950/30 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-orange-600">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="shrink-0 w-14 h-14 rounded-full bg-stone-900 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <svg
                                                className="h-10 w-10 text-orange-400"
                                                viewBox="0 0 64 64"
                                                xmlns="http://www.w3.org/2000/svg"
                                                height="64"
                                                width="64"
                                                version="1.1"
                                            >
                                                <g transform="translate(0.00630876,-0.00301984)">
                                                    <path fill="#f7931a" d="m63.033,39.744c-4.274,17.143-21.637,27.576-38.782,23.301-17.138-4.274-27.571-21.638-23.295-38.78,4.272-17.145,21.635-27.579,38.775-23.305,17.144,4.274,27.576,21.64,23.302,38.784z" />
                                                    <path fill="#FFF" d="m46.103,27.444c0.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-0.875-1.4,5.616c-0.923-0.23-1.871-0.447-2.813-0.662l1.41-5.653-3.509-0.875-1.439,5.766c-0.764-0.174-1.514-0.346-2.242-0.527l0.004-0.018-4.842-1.209-0.934,3.75s2.605,0.597,2.55,0.634c1.422,0.355,1.679,1.296,1.636,2.042l-1.638,6.571c0.098,0.025,0.225,0.061,0.365,0.117-0.117-0.029-0.242-0.061-0.371-0.092l-2.296,9.205c-0.174,0.432-0.615,1.08-1.609,0.834,0.035,0.051-2.552-0.637-2.552-0.637l-1.743,4.019,4.569,1.139c0.85,0.213,1.683,0.436,2.503,0.646l-1.453,5.834,3.507,0.875,1.439-5.772c0.958,0.26,1.888,0.5,2.798,0.726l-1.434,5.745,3.511,0.875,1.453-5.823c5.987,1.133,10.489,0.676,12.384-4.739,1.527-4.36-0.076-6.875-3.226-8.515,2.294-0.529,4.022-2.038,4.483-5.155zm-8.022,11.249c-1.085,4.36-8.426,2.003-10.806,1.412l1.928-7.729c2.38,0.594,10.012,1.77,8.878,6.317zm1.086-11.312c-0.99,3.966-7.1,1.951-9.082,1.457l1.748-7.01c1.982,0.494,8.365,1.416,7.334,5.553z" />
                                                </g>
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-lg text-stone-100 mb-1">
                                                {t("bitcoin")}
                                            </div>
                                            <div className="text-sm text-stone-400 break-all">
                                                bc1q0w2prmyzzfed985pwausvuktaya5gq0f88cevh
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard('bc1q0w2prmyzzfed985pwausvuktaya5gq0f88cevh')}
                                        className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-900/30 text-orange-200 rounded-lg hover:bg-orange-900/50 transition-colors"
                                    >
                                        {copiedAddress === 'bc1q0w2prmyzzfed985pwausvuktaya5gq0f88cevh' ? (
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
                                <div className="absolute inset-0 bg-linear-to-r from-orange-400/0 via-orange-400/5 to-orange-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>

                            {/* Solana */}
                            <div className="group relative overflow-hidden rounded-xl border-2 border-purple-900/50 bg-linear-to-br from-purple-950/30 to-violet-950/30 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-purple-600">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="shrink-0 w-14 h-14 rounded-full bg-stone-900 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                                                <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="360.8791" y1="351.4553" x2="141.213" y2="-69.2936" gradientTransform="matrix(1 0 0 -1 0 314)">
                                                    <stop offset="0" style={{ stopColor: '#00FFA3' }} />
                                                    <stop offset="1" style={{ stopColor: '#DC1FFF' }} />
                                                </linearGradient>
                                                <path className="st0" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5  c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z" />
                                                <linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="264.8291" y1="401.6014" x2="45.163" y2="-19.1475" gradientTransform="matrix(1 0 0 -1 0 314)">
                                                    <stop offset="0" style={{ stopColor: '#00FFA3' }} />
                                                    <stop offset="1" style={{ stopColor: '#DC1FFF' }} />
                                                </linearGradient>
                                                <path className="st1" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5  c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z" />
                                                <linearGradient id="SVGID_3_" gradientUnits="userSpaceOnUse" x1="312.5484" y1="376.688" x2="92.8822" y2="-44.061" gradientTransform="matrix(1 0 0 -1 0 314)">
                                                    <stop offset="0" style={{ stopColor: '#00FFA3' }} />
                                                    <stop offset="1" style={{ stopColor: '#DC1FFF' }} />
                                                </linearGradient>
                                                <path className="st2" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4  c5.8,0,8.7-7,4.6-11.1L333.1,120.1z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-lg text-stone-100 mb-1">
                                                {t("solana")}
                                            </div>
                                            <div className="text-sm text-stone-400 break-all">
                                                64Vp7Qr3ibBRznvWAvgxkVstipSouYwRwxEQs8GcZrg9
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard('64Vp7Qr3ibBRznvWAvgxkVstipSouYwRwxEQs8GcZrg9')}
                                        className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-900/30 text-purple-200 rounded-lg hover:bg-purple-900/50 transition-colors"
                                    >
                                        {copiedAddress === '64Vp7Qr3ibBRznvWAvgxkVstipSouYwRwxEQs8GcZrg9' ? (
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
                                <div className="absolute inset-0 bg-linear-to-r from-purple-400/0 via-purple-400/5 to-purple-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>
                        </div>
                    )}

                </div>

                {/* Other Ways to Support */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-stone-100 mb-6">
                        {t("otherWays")}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {otherWays.map((way) => (
                            <Card
                                key={way.text}
                                className="hover:shadow-lg hover:shadow-stone-700/20 hover:border-stone-600 transition-all duration-300 cursor-pointer group"
                                onClick={way.action}
                            >
                                <CardContent className="text-center">
                                    <div
                                        className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${way.color} mb-3 group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-offset-stone-950 transition-all duration-300`}
                                    >
                                        <way.icon className="h-6 w-6 group-hover:brightness-110 transition-all duration-300" />
                                    </div>
                                    <p className="font-medium text-stone-300 group-hover:text-stone-100 transition-colors duration-300">
                                        {way.text}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Social Links */}
                <Card className="bg-stone-900/50">
                    <CardHeader>
                        <CardTitle className="text-center text-xl">
                            {t("connect")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap justify-center gap-4">
                            {/* Reddit */}
                            <Button
                                asChild
                                variant="outline"
                                className="transition-colors hover:bg-orange-900/30 hover:text-orange-400"
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
                <footer className="mt-16 md:mt-24 text-center px-4">
                    <p className="text-stone-500 text-sm mb-2">
                        🧡 Community-driven salary transparency
                    </p>
                    <p className="text-stone-400 text-xs">
                        Made with ❤️ for the community •{" "}
                        <a
                            href="https://github.com/Berthje/wagewatchers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-400 hover:text-stone-300 underline transition-colors"
                        >
                            View on GitHub
                        </a>
                    </p>
                </footer>
            </div>
        </div >
    );
}
