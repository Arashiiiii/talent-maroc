/**
 * Short-lived HMAC-SHA256 tokens for authorising the Playwright headless
 * browser to render /cv/[id]/print without a user session.
 *
 * Token format: "<cvId>:<issuedAtMs>.<base64url-signature>"
 * Default expiry: 5 minutes.
 */

async function getKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const secret = process.env.PDF_TOKEN_SECRET;
  if (!secret) throw new Error("PDF_TOKEN_SECRET is not set");
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage,
  );
}

export async function signToken(cvId: string): Promise<string> {
  const payload = `${cvId}:${Date.now()}`;
  const key = await getKey(["sign"]);
  const sig = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return `${payload}.${Buffer.from(sig).toString("base64url")}`;
}

export async function verifyToken(
  token:    string,
  cvId:     string,
  maxAgeMs: number = 5 * 60 * 1000,
): Promise<boolean> {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot < 0) return false;

    const payload = token.slice(0, lastDot);
    const sigB64  = token.slice(lastDot + 1);

    const [tokenId, tsStr] = payload.split(":");
    if (tokenId !== cvId) return false;

    const ts = Number(tsStr);
    if (!Number.isFinite(ts) || Date.now() - ts > maxAgeMs) return false;

    const key = await getKey(["verify"]);
    return globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      Buffer.from(sigB64, "base64url"),
      new TextEncoder().encode(payload),
    );
  } catch {
    return false;
  }
}
