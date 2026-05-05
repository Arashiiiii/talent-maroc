import { NextRequest, NextResponse } from "next/server";

// Add DODO_WEBHOOK_SECRET to your env after setting up the webhook in Dodo dashboard
const WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Signature verification (Standard Webhooks spec)
    if (WEBHOOK_SECRET) {
      const webhookId        = req.headers.get("webhook-id") ?? "";
      const webhookTimestamp = req.headers.get("webhook-timestamp") ?? "";
      const webhookSig       = req.headers.get("webhook-signature") ?? "";

      const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
      const secret = Buffer.from(WEBHOOK_SECRET.replace(/^whsec_/, ""), "base64");

      const { createHmac } = await import("crypto");
      const expectedSig = createHmac("sha256", secret)
        .update(signedContent)
        .digest("base64");

      const sigParts = webhookSig.split(" ").map((s: string) => s.split(",")[1]);
      if (!sigParts.includes(expectedSig)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    console.log("Dodo webhook received:", payload.type);

    // Handle relevant events
    if (payload.type === "payment.succeeded") {
      const payment = payload.data;
      console.log("Payment succeeded:", payment.payment_id);
      // Add any server-side logic here (e.g., unlock feature, send email)
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
