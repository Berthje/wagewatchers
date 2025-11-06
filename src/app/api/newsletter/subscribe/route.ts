import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    // Check if email already exists
    const existingSubscriber = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existingSubscriber.length > 0) {
      // If already subscribed and active, return success
      if (existingSubscriber[0].isActive) {
        return NextResponse.json({ message: "Already subscribed to newsletter" }, { status: 200 });
      }
      // If inactive, reactivate
      await db
        .update(newsletterSubscribers)
        .set({ isActive: true })
        .where(eq(newsletterSubscribers.email, email));

      return NextResponse.json(
        { message: "Successfully resubscribed to newsletter" },
        { status: 200 }
      );
    }

    // Add new subscriber
    await db.insert(newsletterSubscribers).values({
      email,
      isActive: true,
    });

    return NextResponse.json({ message: "Successfully subscribed to newsletter" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Newsletter subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
