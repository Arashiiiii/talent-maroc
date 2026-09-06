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

      // CV template unlock — grant permanent access to the purchased template.
      const metadata = payment.metadata ?? {};
      if (metadata.purpose === "cv_template" && metadata.template_id && metadata.user_id) {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          console.error("Cannot grant cv_template entitlement: SUPABASE_SERVICE_ROLE_KEY missing");
        } else {
          const { createClient } = await import("@supabase/supabase-js");
          const adminSb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
          const { error: upsertErr } = await adminSb.from("cv_template_purchases").upsert(
            {
              user_id:         metadata.user_id,
              template_id:     metadata.template_id,
              dodo_payment_id: payment.payment_id,
            },
            { onConflict: "user_id,template_id" },
          );
          if (upsertErr) {
            console.error("Failed to grant cv_template entitlement:", upsertErr.message);
          } else {
            console.log(`Granted template "${metadata.template_id}" to user ${metadata.user_id}`);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
