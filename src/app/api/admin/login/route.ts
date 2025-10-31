import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email?.trim() || !password?.trim()) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 },
            );
        }

        const trimmedEmail = email.trim();

        // Find admin by email
        const admin = await db.select().from(admins).where(eq(admins.email, trimmedEmail)).limit(1);

        if (!admin[0]) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 },
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin[0].password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 },
            );
        }

        // Create JWT token
        const token = jwt.sign(
            { adminId: admin[0].id, email: admin[0].email },
            process.env.JWT_SECRET || "fallback-secret-key",
            { expiresIn: "24h" },
        );

        // Create response with token
        const response = NextResponse.json({
            message: "Login successful",
            admin: { id: admin[0].id, email: admin[0].email },
        });

        // Set HTTP-only cookie with the token
        response.cookies.set("admin-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return response;
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
