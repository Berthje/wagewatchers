import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
            locale:
                locale === "en" ? "en_US" : `${locale}_${locale.toUpperCase()}`,
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
            canonical: `https://wagewatchers.com/${locale}`,
            languages: {
                en: "https://wagewatchers.com/en",
                nl: "https://wagewatchers.com/nl",
                fr: "https://wagewatchers.com/fr",
                de: "https://wagewatchers.com/de",
            },
        },
    };
}

async function HomeContent({ locale }: Readonly<{ locale: string }>) {
    const t = await getTranslations({ locale, namespace: "home" });
    const navT = await getTranslations({ locale, namespace: "nav" });

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-950 to-stone-900 relative overflow-hidden">
            <AnimatedWorldMap />

            {/* Header */}
            <Navbar
                locale={locale}
                translations={{
                    dashboard: navT("dashboard"),
                    statistics: navT("statistics"),
                    feedback: navT("feedback"),
                    status: navT("status"),
                    donate: navT("donate"),
                    addEntry: navT("addEntry"),
                }}
            />

            {/* Hero Section */}
            <main className="relative z-10 container mx-auto px-4 py-12 md:pt-20">
                <div className="text-center mb-12 md:mb-20">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-stone-100 mb-4 md:mb-6 tracking-tight leading-tight">
                        {t("title.salary")}{" "}
                        <span className="relative inline-block px-3 py-2 mx-2">
                            <span className="relative z-10 block">
                                {t("title.transparency")}
                            </span>
                            <span className="absolute inset-0 bg-orange-500/90 transform -skew-x-12 -rotate-1 origin-center"></span>
                        </span>
                    </h1>
                    <p className="text-base md:text-xl text-stone-400 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
                        {t("subtitle")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md mx-auto sm:max-w-none">
                        <Link
                            href={`/${locale}/dashboard`}
                            className="w-full sm:w-auto"
                        >
                            <Button
                                size="lg"
                                className="w-full sm:w-auto px-6 md:px-8 bg-stone-100 hover:bg-stone-200 text-stone-900 text-base md:text-lg"
                            >
                                {t("exploreData")}
                            </Button>
                        </Link>
                        <Link
                            href={`/${locale}/add`}
                            className="w-full sm:w-auto"
                        >
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto px-6 md:px-8 border-stone-700
               text-stone-300
               bg-stone-800
               hover:bg-transparent
               text-base md:text-lg transition-colors"
                            >
                                {t("shareSalary")}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto px-4">
                    <Card className="border-stone-800 bg-stone-900/60 backdrop-blur-sm hover:bg-stone-900/80 transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-stone-100 text-lg md:text-xl">
                                {t("features.multiCountry.title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-stone-400 text-sm md:text-base leading-relaxed">
                                {t("features.multiCountry.description")}
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="border-stone-800 bg-stone-900/60 backdrop-blur-sm hover:bg-stone-900/80 transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-stone-100 text-lg md:text-xl">
                                {t("features.privacy.title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-stone-400 text-sm md:text-base leading-relaxed">
                                {t("features.privacy.description")}
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="border-stone-800 bg-stone-900/60 backdrop-blur-sm hover:bg-stone-900/80 transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-stone-100 text-lg md:text-xl">
                                {t("features.analysis.title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-stone-400 text-sm md:text-base leading-relaxed">
                                {t("features.analysis.description")}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <footer className="mt-16 md:mt-24 text-center px-4">
                    <p className="text-stone-500 text-sm mb-2">
                        {t("footer")}
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
