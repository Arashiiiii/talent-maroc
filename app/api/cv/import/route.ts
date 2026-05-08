import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CVDataSchema } from "../../../cv/_lib/schema";

export const runtime    = "nodejs";
export const maxDuration = 30;

// ─── Extraction helpers ───────────────────────────────────────────────────────

type PdfParseFn = (buf: Buffer, opts?: Record<string, unknown>) => Promise<{ text: string }>;

async function extractPdf(buf: Buffer): Promise<string> {
  // Cast through unknown to handle both CJS (.default) and ESM (direct export)
  // without relying on internal package paths that differ between builds.
  const mod = (await import("pdf-parse")) as unknown;
  const pdfParse: PdfParseFn =
    typeof (mod as { default?: unknown }).default === "function"
      ? (mod as { default: PdfParseFn }).default
      : (mod as PdfParseFn);
  const result = await pdfParse(buf);
  return result.text;
}

async function extractDocx(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result  = await mammoth.extractRawText({ buffer: buf });
  return result.value;
}

// ─── Ensure every array item has an id field ─────────────────────────────────

function ensureIds(cv: Record<string, unknown>): void {
  const arrays = ["experience", "education", "skills", "languages", "certifications", "projects"] as const;
  for (const key of arrays) {
    const arr = cv[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item && typeof item === "object" && !(item as Record<string, unknown>).id) {
        (item as Record<string, unknown>).id = crypto.randomUUID().slice(0, 8);
      }
    }
  }
}

// ─── Claude system prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional CV parser.
Extract ALL information from the CV text and return a single valid JSON object. No markdown, no explanation — JSON only.

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
- Split the person's full name into firstName / lastName.
- For experience bullets: write ONE achievement per bullet, starting with a strong past-tense action verb.
- For languages dots: Native=5, Fluent=4, Advanced=3, Intermediate=2, Basic=1.
- Omit empty arrays (leave [] instead of removing the key).
- Return ONLY the JSON object, nothing else.`;

// ─── Route handler ────────────────────────────────────────────────────────────

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

  const name = file.name.toLowerCase();
  const type = file.type;

  const buf = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    if (type === "application/pdf" || name.endsWith(".pdf")) {
      text = await extractPdf(buf);
    } else if (
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      text = await extractDocx(buf);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or DOCX file." },
        { status: 415 },
      );
    }
  } catch (err) {
    console.error("Text extraction error:", err);
    return NextResponse.json({ error: "Could not read the file content." }, { status: 422 });
  }

  text = text.trim();
  if (!text) {
    return NextResponse.json(
      { error: "The file appears to be empty or image-only. Text extraction returned nothing." },
      { status: 422 },
    );
  }

  // Clip to ~6 000 chars to stay inside Haiku's sweet spot
  const clipped = text.length > 6000 ? text.slice(0, 6000) + "\n[...]" : text;

  // ── Claude extraction ───────────────────────────────────────────────────────
  const client = new Anthropic();
  let raw: string;
  try {
    const msg = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: `Parse this CV:\n\n${clipped}` }],
    });
    raw = (msg.content[0] as { type: "text"; text: string }).text.trim();
  } catch (err) {
    console.error("Claude error:", err);
    return NextResponse.json({ error: "AI extraction failed. Please try again." }, { status: 502 });
  }

  // Strip markdown code fences if Claude wrapped the JSON anyway
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error("Bad JSON from Claude:", jsonStr.slice(0, 200));
    return NextResponse.json({ error: "AI returned malformed JSON." }, { status: 500 });
  }

  // Ensure every array item has an id before schema validation
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
