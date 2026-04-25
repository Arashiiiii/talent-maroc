import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

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

    const candidateText = candidates
      .slice(0, 10)
      .map((c, i) => {
        const lines = [
          `**Candidat ${i + 1} : ${c.name}**`,
          c.email ? `- Email : ${c.email}` : null,
          `- Poste visé : ${c.job_title}`,
          `- Statut : ${c.status}`,
          c.applied_at ? `- Date de candidature : ${new Date(c.applied_at).toLocaleDateString("fr-FR")}` : null,
          c.cover_letter ? `- Lettre de motivation : ${c.cover_letter.slice(0, 300)}…` : "- Lettre de motivation : Non fournie",
          c.notes ? `- Notes recruteur : ${c.notes}` : null,
          c.cv_url ? "- CV : Disponible (PDF joint)" : "- CV : Non fourni",
        ].filter(Boolean);
        return lines.join("\n");
      })
      .join("\n\n");

    const systemPrompt = `Tu es un assistant RH expert en recrutement au Maroc. Tu analyses des candidatures et tu fournis des comparaisons claires et objectives pour aider les recruteurs à prendre de meilleures décisions. Réponds toujours en français, de manière structurée et professionnelle.`;

    const userPrompt = `Compare les ${candidates.slice(0, 10).length} candidats suivants pour le poste de "${job_title}".

${job_description ? `Description du poste :\n${job_description.slice(0, 500)}\n\n` : ""}Candidats :\n\n${candidateText}

Pour chaque candidat, fournis :
1. **Score de correspondance** (1-10) avec justification courte
2. **Points forts** (2-3 points)
3. **Points d'attention** (1-2 points)

Termine par :
**Recommandation finale** : Quel(s) candidat(s) privilégier et pourquoi (3-4 phrases maximum).

Format clair, sans markdown excessif. Maximum 500 mots.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    const result = data.content?.[0]?.type === "text" ? data.content[0].text : "";

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("ai-compare error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
