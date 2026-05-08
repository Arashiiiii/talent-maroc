import { NextResponse } from "next/server";
import { signToken } from "../../../../cv/_lib/pdf-token";

export const runtime    = "nodejs";
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!process.env.PDF_TOKEN_SECRET) {
    return NextResponse.json({ error: "PDF_TOKEN_SECRET not configured" }, { status: 500 });
  }

  const cvId  = params.id;
  const token = await signToken(cvId);
  const base  = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url   = `${base}/cv/${cvId}/print?token=${encodeURIComponent(token)}`;

  // Dynamic import keeps playwright out of the edge bundle
  const { chromium } = await import("playwright");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

    // Wait for fonts / images that may load after networkidle
    await page.waitForTimeout(400);

    const pdf = await page.pdf({
      format:          "A4",
      printBackground: true,
      margin:          { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new NextResponse(pdf, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="cv.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } finally {
    await browser.close();
  }
}
