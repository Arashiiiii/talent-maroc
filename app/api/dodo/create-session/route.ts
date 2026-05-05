import { NextRequest, NextResponse } from "next/server";

const DODO_BASE = "https://live.dodopayments.com";

export async function POST(req: NextRequest) {
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

    if (!res.ok) {
      const err = await res.text();
      console.error("DodoPayments create error:", err);
      return NextResponse.json({ error: "Échec de la création de session" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      paymentLink: data.payment_link,
      paymentId:   data.payment_id,
    });
  } catch (err: any) {
    console.error("create-session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
