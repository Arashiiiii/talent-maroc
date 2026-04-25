import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Clé API non configurée." }, { status: 500 });
  }

  try {
    const { type, data } = await req.json() as {
      type: "cover_letter" | "linkedin_bio";
      data: Record<string, string>;
    };

    let systemPrompt: string;
    let userPrompt: string;

    if (type === "cover_letter") {
      systemPrompt = `Tu es un expert en rédaction de lettres de motivation pour le marché marocain et francophone. Tu rédiges des lettres professionnelles, personnalisées et convaincantes. Réponds directement avec la lettre, sans commentaire ni explication.`;
      userPrompt = `Rédige une lettre de motivation professionnelle pour ${data.name || "le candidat"} qui postule au poste de "${data.job_title}" chez ${data.company}.

Informations sur le candidat :
- Titre professionnel : ${data.candidate_title || "Non précisé"}
- Compétences clés : ${data.skills || "Non précisées"}
- Expérience : ${data.experience || "Non précisée"}
- Localisation : ${data.location || "Maroc"}
${data.job_description ? `\nDescription du poste :\n${data.job_description.slice(0, 500)}` : ""}

La lettre doit être :
- Personnalisée pour ce poste et cette entreprise
- Professionnelle, dynamique et convaincante
- Entre 250 et 350 mots
- Structurée en 3 paragraphes : accroche percutante, valeur ajoutée concrète, conclusion avec call-to-action
- Adaptée au marché marocain/francophone
- Commencer par "Madame, Monsieur,"`;

    } else if (type === "linkedin_bio") {
      systemPrompt = `Tu es un expert en personal branding et rédaction de profils LinkedIn pour le marché marocain. Tu rédiges des bios percutantes et authentiques en français. Réponds directement avec la bio, sans commentaire ni explication.`;
      userPrompt = `Rédige une bio LinkedIn percutante pour ${data.name || "ce professionnel"}.

Informations :
- Titre professionnel : ${data.candidate_title || "Non précisé"}
- Secteur : ${data.industry || "Non précisé"}
- Compétences clés : ${data.skills || "Non précisées"}
- Expérience : ${data.experience || "Non précisée"}
- Localisation : ${data.location || "Maroc"}

La bio LinkedIn doit :
- Faire entre 150 et 200 mots
- Commencer par une accroche forte qui capte l'attention
- Mettre en avant la valeur ajoutée unique, pas juste une liste de titres
- Mentionner les domaines d'expertise principaux
- Être rédigée à la première personne
- Se terminer par ce que le candidat recherche ou apporte
- Avoir un ton professionnel mais humain et accessible`;

    } else {
      return NextResponse.json({ error: "Type invalide." }, { status: 400 });
    }

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

    const result = await response.json();
    const text = result.content?.[0]?.type === "text" ? result.content[0].text : "";
    return NextResponse.json({ result: text });

  } catch (err: any) {
    console.error("generate-tools error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
