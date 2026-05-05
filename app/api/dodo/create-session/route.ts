import { NextRequest, NextResponse } from "next/server";

const DODO_BASE = "https://live.dodopayments.com";

export async function POST(req: NextRequest) {
  if (!process.env.DODO_API_KEY) {
    console.error("DODO_API_KEY is not set in environment variables");
    return NextResponse.json(
      { error: "Configuration paiement manquante (DODO_API_KEY)" },
      { status: 500 }
    );
  }

  try {
    const { productId, customerEmail, customerName } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const body: Record<string, any> = {
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
        "Authorization": `Bearer ${process.env.DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error("DodoPayments API error:", res.status, responseText);
      return NextResponse.json(
        { error: `DodoPayments error ${res.status}: ${responseText}` },
        { status: 502 }
      );
    }

    const data = JSON.parse(responseText);

    if (!data.payment_link) {
      console.error("DodoPayments response missing payment_link:", data);
      return NextResponse.json(
        { error: "Lien de paiement absent dans la réponse" },
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
