import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Only add PDF beta header when the request actually contains a PDF document
    const hasPdf = JSON.stringify(body).includes('"application/pdf"');

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        ...(hasPdf ? { "anthropic-beta": "pdfs-2024-09-25" } : {}),
      },
      body: JSON.stringify(body),
    });

    // Return the raw Anthropic response — including error bodies
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("generate-cv route error:", error);
    return NextResponse.json(
      { error: { message: error.message || "Erreur serveur interne." } },
      { status: 500 }
    );
  }
}