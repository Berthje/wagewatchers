"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.push("/admin/login");
    }, [router]);

    return null;
}