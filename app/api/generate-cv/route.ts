import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const body = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: { message: "Clé API manquante dans les variables d'environnement." } },
        { status: 500 }
      );
    }

    const { isPdf, ...anthropicBody } = body;
    const hasPdf = isPdf === true;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        ...(hasPdf ? { "anthropic-beta": "pdfs-2024-09-25" } : {}),
      },
      body: JSON.stringify({
        ...anthropicBody,
        model: hasPdf
          ? "claude-sonnet-4-20250514"
          : "claude-haiku-4-5-20251001",
      }),
    });

    clearTimeout(timeoutId);

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

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return NextResponse.json(
        {
          error: {
            message: data?.error?.message || "Erreur retournée par le service IA.",
          },
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("generate-cv route error:", error);

    if (error.name === "AbortError") {
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