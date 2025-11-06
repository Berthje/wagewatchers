import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema";
import { eq, ilike, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const search = searchParams.get("search");

    if (!country) {
      return NextResponse.json({ error: "Country parameter is required" }, { status: 400 });
    }

    // Build where conditions
    const whereConditions =
      search && search.length >= 3
        ? and(eq(cities.country, country), ilike(cities.name, `%${search}%`))
        : eq(cities.country, country);

    const result = await db
      .select({ name: cities.name })
      .from(cities)
      .where(whereConditions)
      .orderBy(cities.name)
      .limit(15);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
