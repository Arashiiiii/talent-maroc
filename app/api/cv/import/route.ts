import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CVDataSchema } from "../../../cv/_lib/schema";

export const runtime     = "nodejs";
export const maxDuration = 30;

// ─── ID helper ───────────────────────────────────────────────────────────────

function ensureIds(cv: Record<string, unknown>): void {
  for (const key of ["experience", "education", "skills", "languages", "certifications", "projects"]) {
    const arr = cv[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item && typeof item === "object" && !(item as Record<string, unknown>).id) {
        (item as Record<string, unknown>).id = crypto.randomUUID().slice(0, 8);
      }
    }
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional CV parser.
Extract ALL information from the CV and return a single valid JSON object. No markdown, no explanation — JSON only.

Required shape (fill ALL fields; use "" for missing strings, generate random 8-char ids for array items):
{
  "profile": { "firstName":"","lastName":"","title":"","email":"","phone":"","city":"","website":"","linkedin":"" },
  "summary": "",
  "experience": [{ "id":"a1b2c3d4","role":"","company":"","city":"","start":"","end":"","current":false,"bullets":["bullet text"] }],
  "education":  [{ "id":"a1b2c3d4","degree":"","school":"","city":"","start":"","end":"" }],
  "skills":     [{ "id":"a1b2c3d4","group":"Category","items":["skill1","skill2"] }],
  "languages":  [{ "id":"a1b2c3d4","name":"French","level":"Native","dots":5 }],
  "certifications": [{ "id":"a1b2c3d4","name":"","issuer":"","year":"" }],
  "projects":   [{ "id":"a1b2c3d4","name":"","role":"","detail":"" }],
  "interests":  ["interest1"]
}

Rules:
- Split full name into firstName / lastName.
- Experience bullets: ONE achievement per bullet, strong past-tense action verb.
- Language dots: Native=5, Fluent=4, Advanced=3, Intermediate=2, Basic=1.
- Return ONLY the JSON object, nothing else.`;

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file field in form data" }, { status: 400 });
  }

  const fname = file.name.toLowerCase();
  const ftype = file.type;
  const buf   = Buffer.from(await file.arrayBuffer());

  const client = new Anthropic();
  let raw: string;

  try {
    // ── PDF: send as native Claude document (no text extraction needed) ────────
    if (ftype === "application/pdf" || fname.endsWith(".pdf")) {
      const msg = await client.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system:     SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") } } as any,
            { type: "text", text: "Parse this CV and return only the JSON as instructed." },
          ],
        }],
      });
      raw = (msg.content[0] as { type: "text"; text: string }).text.trim();

    // ── DOCX: extract text with mammoth, send as plain text ───────────────────
    } else if (
      ftype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fname.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const { value: text } = await mammoth.extractRawText({ buffer: buf });
      if (!text.trim()) {
        return NextResponse.json({ error: "The DOCX file appears to be empty." }, { status: 422 });
      }
      const clipped = text.length > 6000 ? text.slice(0, 6000) + "\n[...]" : text;
      const msg = await client.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: "user", content: `Parse this CV:\n\n${clipped}` }],
      });
      raw = (msg.content[0] as { type: "text"; text: string }).text.trim();

    } else {
      return NextResponse.json({ error: "Unsupported file type. Upload a PDF or DOCX." }, { status: 415 });
    }
  } catch (err) {
    console.error("Claude import error:", err);
    return NextResponse.json({ error: "AI extraction failed. Please try again." }, { status: 502 });
  }

  // Strip markdown fences if Claude wrapped the response anyway
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error("Bad JSON from Claude:", jsonStr.slice(0, 200));
    return NextResponse.json({ error: "AI returned malformed JSON." }, { status: 500 });
  }

  if (parsed && typeof parsed === "object") {
    ensureIds(parsed as Record<string, unknown>);
  }

  const result = CVDataSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Schema validation failed:", result.error.flatten());
    return NextResponse.json({ error: "Extracted data did not match the CV schema." }, { status: 422 });
  }

  return NextResponse.json({ cv: result.data });
}
