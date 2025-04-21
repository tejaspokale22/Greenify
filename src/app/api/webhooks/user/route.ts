import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix"; // Clerk Webhooks use Svix
import db from "@/db/index"; // Your Drizzle DB instance
import { Users } from "@/db/schema"; // Your Drizzle user schema
import { eq } from "drizzle-orm";

const CLERK_WEBHOOK_SECRET_USER = process.env.CLERK_WEBHOOK_SECRET_USER!;

interface WebhookEvent {
  data: {
    id: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    image_url?: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    created_at: number;
    updated_at: number;
  };
  object: string;
  type: string;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  try {
    // Verify webhook signature
    const wh = new Webhook(CLERK_WEBHOOK_SECRET_USER);
    const evt = wh.verify(body, headers) as WebhookEvent;

    const user = evt.data;

    const fullName =
        user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Anonymous User";

    if (evt.type === "user.created") {
      const existingUser = await db
        .select()
        .from(Users)
        .where(eq(Users.clerkId, user.id))
        .execute();

      if (existingUser.length === 0) {
        await db.insert(Users).values({
          clerkId: user.id,
          email: user.email_addresses[0].email_address,
          fullName,
          profileImage: user.image_url,
        });

      } else {
        console.log("⚠️ User already exists:", user.id);
      }

    } else if (evt.type === "user.updated") {
      await db
        .update(Users)
        .set({
          email: user.email_addresses[0].email_address,
          fullName,
          profileImage: user.image_url || "",
        })
        .where(eq(Users.clerkId, user.id))
        .execute();
        
    } else if (evt.type === "user.deleted") {
      await db.delete(Users).where(eq(Users.clerkId, user.id)).execute();
      console.log("🗑️ User deleted:", user.id);
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook verification failed:", error);
    return NextResponse.json({ error: "Invalid Webhook Signature" }, { status: 400 });
  }
}
