import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

/**
 * Server-side admin authentication verification
 * Use this in server components to check if user is authenticated
 */
export async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token");

    if (!token) {
      return false;
    }

    verify(token.value, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get admin ID from JWT token
 */
export async function getAdminId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token");

    if (!token) {
      return null;
    }

    const decoded = verify(token.value, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}
