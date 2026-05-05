import { NextRequest, NextResponse } from "next/server";

// Switch between test and live based on env
const DODO_MODE = process.env.DODO_MODE || "live"; // set DODO_MODE=test in Vercel to use sandbox
const DODO_BASE = DODO_MODE === "test"
  ? "https://test.dodopayments.com"
  : "https://live.dodopayments.com";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DODO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "DODO_API_KEY manquant dans les variables d'environnement Vercel" },
      { status: 500 }
    );
  }

  try {
    const { productId, customerEmail, customerName } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const body = {
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: customerEmail || "client@talentmaroc.shop",
        name:  customerName  || "Client TalentMaroc",
      },
      billing: { country: "MA" },
      payment_link: true,
    };

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
