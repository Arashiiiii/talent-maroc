import { NextRequest, NextResponse } from "next/server";

const DODO_BASE = "https://live.dodopayments.com";

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment_id");
  if (!paymentId) {
    return NextResponse.json({ error: "payment_id requis" }, { status: 400 });
  }

  try {
    const res = await fetch(`${DODO_BASE}/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${process.env.DODO_API_KEY}` },
    });

    if (!res.ok) {
      return NextResponse.json({ status: "pending" });
    }

    const data = await res.json();
    // DodoPayments uses `status` or `payment_status`
    const status: string = data.status ?? data.payment_status ?? "pending";
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ status: "pending" });
  }
}
