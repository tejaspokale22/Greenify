import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

const CLERK_WEBHOOK_SECRET_SESSION = process.env.CLERK_WEBHOOK_SECRET_SESSION;

export async function POST(req: NextRequest) {
  try {
    const headers = req.headers;
    const svixId = headers.get("svix-id");
    const svixTimestamp = headers.get("svix-timestamp");
    const svixSignature = headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature || !CLERK_WEBHOOK_SECRET_SESSION) {
      return NextResponse.json(false, { status: 400 });
    }

    const payload = await req.text();

    try {
      const wh = new Webhook(CLERK_WEBHOOK_SECRET_SESSION);
      wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (error) {
      console.error("Invalid webhook signature:", error);
      return NextResponse.json(false, { status: 401 });
    }

    const body = JSON.parse(payload);

    if (!body.type || !body.data) {
      return NextResponse.json(false, { status: 400 });
    }

    if (body.type === "session.created") {
      return NextResponse.json(true);
    }

    if (body.type === "session.ended") {
      return NextResponse.json(false);
    }

    return NextResponse.json(false);
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(false, { status: 500 });
  }
}
