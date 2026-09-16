import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Switch between test and live based on env
const DODO_MODE = process.env.DODO_MODE || "live"; // set DODO_MODE=test in Vercel to use sandbox
const DODO_BASE = DODO_MODE === "test"
  ? "https://test.dodopayments.com"
  : "https://live.dodopayments.com";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "DODO_PAYMENTS_API_KEY manquant dans les variables d'environnement Vercel" },
      { status: 500 }
    );
  }

  // Identify the buyer server-side from their session token — never trust a
  // client-supplied user id, since it ends up in payment metadata and is
  // used later (by the webhook) to grant entitlements to that account.
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquant" }, { status: 500 });
  }
  const adminSb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { data: { user }, error: authErr } = await adminSb.auth.getUser(token);
  if (!user || authErr) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { productId, metadata, returnUrl } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const body: Record<string, unknown> = {
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: user.email || "client@talentmaroc.shop",
        name:  (user.user_metadata?.full_name as string | undefined) || "Client TalentMaroc",
      },
      billing: { country: "MA" },
      payment_link: true,
      // user_id is set from the verified session, overriding anything a
      // caller might pass in `metadata`, so it can't be spoofed.
      metadata: { ...(metadata ?? {}), user_id: user.id },
    };
    if (returnUrl) body.return_url = returnUrl;

    const res = await fetch(`${DODO_BASE}/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await res.text();

    if (!res.ok) {
      // Return the exact DodoPayments error so it's visible in browser console
      console.error(`DodoPayments ${DODO_MODE} error ${res.status}:`, responseText);
      return NextResponse.json(
        { error: `[DodoPayments ${res.status}] ${responseText}` },
        { status: 502 }
      );
    }

    const data = JSON.parse(responseText);

    if (!data.payment_link) {
      console.error("DodoPayments response missing payment_link:", data);
      return NextResponse.json(
        { error: "Lien de paiement absent dans la réponse Dodo" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      paymentLink: data.payment_link,
      paymentId:   data.payment_id,
    });

  } catch (err: any) {
    console.error("create-session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
