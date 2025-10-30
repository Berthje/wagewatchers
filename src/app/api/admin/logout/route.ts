import { NextResponse } from "next/server";

export async function POST() {
    try {
        // Create response
        const response = NextResponse.json({
            message: "Logged out successfully",
        });

        // Clear the admin token cookie
        response.cookies.set("admin-token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0, // Expire immediately
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
