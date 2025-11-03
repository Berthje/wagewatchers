"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if already authenticated and redirect to reports
        const checkAuth = async () => {
            try {
                const response = await fetch("/api/admin/verify");
                const data = await response.json();

                if (data.authenticated) {
                    router.push("/admin/reports");
                }
            } catch (error) {
                console.error("Auth check error:", error);
            }
        };

        checkAuth();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password.trim()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Set a simple session flag for client-side checks
                localStorage.setItem("adminAuthenticated", "true");
                router.push("/admin/reports");
            } else {
                setError(data.error || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("An error occurred during login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900">
            {/* Header */}
            <header className="relative z-10 container mx-auto px-4 py-4 md:py-6">
                <nav className="flex items-center justify-between">
                    <Link href="/en">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-stone-300 hover:text-stone-100 text-sm md:text-base"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                    </Link>
                </nav>
            </header>

            <div className="container mx-auto p-6 max-w-md">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-stone-900" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 text-stone-100">
                        Admin Login
                    </h1>
                    <p className="text-stone-400">
                        Access the admin panel to manage bug reports and
                        features.
                    </p>
                </div>

                {error && (
                    <Alert className="mb-6 border-red-800 bg-red-950/50">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-200">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="border-stone-800 bg-stone-900/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-stone-100">
                            Login
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-stone-100"
                                >
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="border-stone-700 bg-stone-800 text-stone-100"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-stone-100"
                                >
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Enter password"
                                    className="border-stone-700 bg-stone-800 text-stone-100"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
