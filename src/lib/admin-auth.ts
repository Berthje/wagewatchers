import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export interface AdminSession {
  adminId: number;
  email: string;
}

/**
 * Resolve the admin JWT signing secret. Throws if unset so a misconfigured
 * deployment fails loudly instead of silently falling back to a hard-coded,
 * forgeable constant.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

/**
 * Decode and verify the admin session from the `admin-token` cookie.
 * Returns the token payload, or null when the cookie is missing/invalid.
 *
 * This is the single source of truth for admin auth — every admin route and
 * server component should go through this (or the helpers below) rather than
 * re-implementing JWT verification.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token");
    if (!token) {
      return null;
    }
    const decoded = jwt.verify(token.value, getJwtSecret()) as Partial<AdminSession>;
    if (typeof decoded?.adminId !== "number") {
      return null;
    }
    return { adminId: decoded.adminId, email: decoded.email ?? "" };
  } catch {
    return null;
  }
}

/**
 * Server-component guard: true when the caller holds a valid admin session.
 */
export async function verifyAdminAuth(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

/**
 * Get the authenticated admin's id, or null.
 *
 * Reads `adminId` — the field the login route actually signs. (The previous
 * implementation read `userId`, which is never present, so `reviewedBy` was
 * always null.)
 */
export async function getAdminId(): Promise<number | null> {
  const session = await getAdminSession();
  return session?.adminId ?? null;
}

/**
 * Route-handler guard. Returns the admin session, or a 401 `NextResponse` to
 * return directly:
 *
 *   const auth = await requireAdmin();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.adminId / auth.email are available here
 */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
