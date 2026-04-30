import { NextRequest, NextResponse } from "next/server";

interface Candidate {
  name: string;
  email: string | null;
  job_title: string;
  status: string;
  applied_at: string | null;
  notes: string | null;
  cover_letter: string | null;
  cv_url: string | null;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Clé API Anthropic non configurée." }, { status: 500 });
  }

  try {
    const { candidates, job_title, job_description } = await req.json() as {
      candidates: Candidate[];
      job_title: string;
      job_description?: string;
    };

    if (!candidates || candidates.length < 2) {
      return NextResponse.json({ error: "Au moins 2 candidats requis." }, { status: 400 });
    }

    const top = candidates.slice(0, 10);

    const candidateText = top.map((c, i) => [
      `Candidat ${i + 1}: ${c.name}`,
      `Statut: ${c.status}`,
      c.applied_at ? `Candidaté le: ${new Date(c.applied_at).toLocaleDateString("fr-FR")}` : null,
      c.cover_letter ? `Lettre: ${c.cover_letter.slice(0, 250)}` : "Lettre: Non fournie",
      c.notes ? `Notes: ${c.notes}` : null,
      c.cv_url ? "CV: Disponible" : "CV: Non fourni",
    ].filter(Boolean).join(" | ")).join("\n");

    const systemPrompt = `Tu es un expert RH. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après.`;

    const userPrompt = `Analyse ces ${top.length} candidats pour le poste "${job_title}".
${job_description ? `Description: ${job_description.slice(0, 400)}` : ""}

${candidateText}

Réponds avec ce JSON exact:
{
  "candidates": [
    {
      "rank": 1,
      "name": "...",
      "score": 8.5,
      "strengths": ["point fort 1", "point fort 2"],
      "concerns": ["point attention 1"],
      "summary": "Résumé en 1 phrase"
    }
  ],
  "recommendation": "Recommandation finale en 2-3 phrases",
  "top3": ["Nom1", "Nom2", "Nom3"]
}

Classe les candidats du meilleur au moins bon. Score de 1 à 10.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic error: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    const raw  = data.content?.[0]?.type === "text" ? data.content[0].text : "";
    const clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({ result: parsed });
  } catch (err: any) {
    console.error("ai-compare error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
