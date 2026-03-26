import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Use an AbortController to prevent the function from hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second limit

  try {
    const body = await req.json();

    // 1. Validate the API Key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: { message: "Clé API manquante dans les variables d'environnement." } },
        { status: 500 }
      );
    }

    const hasPdf = JSON.stringify(body).includes('"application/pdf"');

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal, // Add the abort signal here
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        ...(hasPdf ? { "anthropic-beta": "pdfs-2024-09-25" } : {}),
      },
      body: JSON.stringify({
        ...body,
        // FORCE Haiku for speed so we don't hit the 10s Vercel timeout
        model: "claude-3-haiku-20240307", 
      }),
    });

    clearTimeout(timeoutId);

    // 2. Critical: Check if the response is actually valid JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response received:", text);
      return NextResponse.json(
        { error: { message: "Réponse invalide de l'IA. Réessayez." } },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("generate-cv route error:", error);

    // Handle the timeout/abort error specifically
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: { message: "La génération prend trop de temps. Réessayez avec un texte plus court." } },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: { message: error.message || "Erreur serveur interne." } },
      { status: 500 }
    );
  }
}