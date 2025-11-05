"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ClipboardCheck,
    LayoutDashboard,
    ArrowRight,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface DashboardCard {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    gradient: string;
    stats?: string;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const authenticated =
                localStorage.getItem("adminAuthenticated") === "true";
            if (!authenticated) {
                router.push("/admin/login");
            } else {
                setIsAuthenticated(true);
            }
            setIsLoading(false);
        };
        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const dashboardCards: DashboardCard[] = [
        {
            title: "Review Entries",
            description: "Approve or reject salary entries flagged for review",
            href: "/admin/review",
            icon: <ClipboardCheck className="h-6 w-6" />,
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            title: "Reports & Feedback",
            description:
                "Manage bug reports, feature requests, and user feedback",
            href: "/admin/reports",
            icon: <LayoutDashboard className="h-6 w-6" />,
            gradient: "from-purple-500 to-pink-500",
        },
    ];

    return (
        <div className="min-h-screen bg-linear-to-br from-stone-950 via-stone-950 to-stone-900">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl">
                            <ShieldCheck className="h-8 w-8 md:w-12 md:h-12 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white bg-clip-text">
                                Admin Dashboard
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Manage and monitor WageWatchers platform
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {dashboardCards.map((card, index) => (
                        <Link key={index} href={card.href} className="group">
                            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-2 hover:border-primary/50 h-full">
                                {/* Gradient Background */}
                                <div
                                    className={`absolute inset-0 bg-linear-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                                ></div>

                                <CardHeader className="relative">
                                    <div className="flex items-start justify-between">
                                        <div
                                            className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white mb-4`}
                                        >
                                            {card.icon}
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                                        {card.title}
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        {card.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
