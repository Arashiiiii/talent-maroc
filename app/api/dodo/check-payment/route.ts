import { NextRequest, NextResponse } from "next/server";

// Must match create-session's mode switch — otherwise in test mode this
// queries the live API for a payment_id that only exists in the sandbox
// (and vice versa), and every check silently falls back to "pending".
const DODO_MODE = process.env.DODO_MODE || "live";
const DODO_BASE = DODO_MODE === "test"
  ? "https://test.dodopayments.com"
  : "https://live.dodopayments.com";

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment_id");
  if (!paymentId) {
    return NextResponse.json({ error: "payment_id requis" }, { status: 400 });
  }

  try {
    const res = await fetch(`${DODO_BASE}/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${process.env.DODO_PAYMENTS_API_KEY}` },
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
