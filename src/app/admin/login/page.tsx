"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { logError } from "@/lib/logger";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If already signed in, go straight to the command center.
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify");
        const data = await response.json();
        if (data.authenticated) {
          router.push("/admin");
        }
      } catch (error) {
        logError("Auth check error", error);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set a simple session flag for client-side checks
        localStorage.setItem("adminAuthenticated", "true");
        router.push("/admin");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      logError("Login error", error);
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-ledger relative flex min-h-screen flex-col bg-background text-foreground">
      {/* Minimal top bar — no sidebar on the auth screen */}
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-5">
        <Link
          href="/en"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Homepage
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md">
          {/* Brand + heading */}
          <div className="mb-8">
            <div
              className="lp-rise mb-6 flex items-center gap-2.5"
              style={{ animationDelay: "0.02s" }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
                <span className="text-sm font-bold text-background">WW</span>
              </div>
              <span className="font-display text-lg font-semibold">WageWatchers</span>
            </div>

            <p
              className="lp-rise mb-3 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
              style={{ animationDelay: "0.08s" }}
            >
              <span className="inline-block h-1.5 w-1.5 bg-brand" aria-hidden="true" />
              Restricted · Staff only
            </p>

            <h1
              className="lp-rise font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] md:text-4xl"
              style={{ animationDelay: "0.14s" }}
            >
              Admin{" "}
              <span className="relative inline-block">
                access
                <span className="lp-marker" aria-hidden="true" />
              </span>
            </h1>

            <p
              className="lp-rise mt-3 text-sm text-muted-foreground"
              style={{ animationDelay: "0.2s" }}
            >
              Sign in to review entries, triage reports, and manage the platform.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="lp-rise mb-6" style={{ animationDelay: "0.24s" }}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="lp-rise" style={{ animationDelay: "0.28s" }}>
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@wagewatchers.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p
            className="lp-rise mt-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
            style={{ animationDelay: "0.34s" }}
          >
            WageWatchers · Control room
          </p>
        </div>
      </div>
    </div>
  );
}
