"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, LogOut, ArrowLeft } from "lucide-react";

/**
 * Reusable admin header with Home, Logout, and conditional Back button
 * Use on all admin pages for consistency
 * Shows "Back to Admin Dashboard" on all pages except the main dashboard
 */
export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  // Show back button on all admin pages except the main dashboard
  const showBackButton = pathname !== "/admin";

  const handleLogout = async () => {
    try {
      // Clear the admin token cookie by making a logout request
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("adminAuthenticated");
    router.push("/admin/login");
  };

  return (
    <div className="flex items-center justify-between">
      {/* Logo */}
      <Link href="/en" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
          <span className="text-stone-900 font-bold text-sm">WW</span>
        </div>
        <span className="text-lg md:text-xl font-bold text-stone-100">WageWatchers</span>
      </Link>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Conditional back button - shows on all pages except main dashboard */}
        {showBackButton && (
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-stone-300 hover:text-stone-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        )}
        <Link href="/en">
          <Button variant="ghost" size="sm" className="text-stone-300 hover:text-stone-100">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-stone-300 hover:text-stone-100"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
