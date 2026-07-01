"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { logError } from "@/lib/logger";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication guard for admin pages
 * Verifies admin session and redirects to login if not authenticated
 */
export function AdminAuthGuard({ children }: Readonly<AdminAuthGuardProps>) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify");
        const data = await response.json();

        if (!data.authenticated) {
          router.push("/admin/login");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        logError("Auth check failed:", error);
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="lp-ledger flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Verifying access…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
