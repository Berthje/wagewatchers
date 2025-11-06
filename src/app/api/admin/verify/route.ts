import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-key") as {
      adminId: number;
      email: string;
    };

    return NextResponse.json({
      authenticated: true,
      admin: { id: decoded.adminId, email: decoded.email },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
