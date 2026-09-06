"use client";
/**
 * useTemplateEntitlements — tracks which CV templates the current user has
 * permanently unlocked, and drives the "buy this template" redirect flow.
 *
 * Every template is a standalone Dodo purchase (see cv-lib/dodo-products.ts);
 * `owned` reflects the cv_template_purchases table, written only by the
 * webhook after a confirmed payment. `owned === null` means "still loading" —
 * callers should treat that as "unknown, don't render a lock yet" rather
 * than "locked", to avoid a flash of lock icons before the first fetch.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import type { TemplateId } from "../_lib/schema";
import { CV_TEMPLATE_PRODUCTS } from "../_lib/dodo-products";

function getSB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const PENDING_KEY = "dodo_cv_template_pending";

export function useTemplateEntitlements() {
  const [owned, setOwned]         = useState<Set<TemplateId> | null>(null);
  const [unlocking, setUnlocking] = useState<TemplateId | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const sbRef = useRef(getSB());

  const refresh = useCallback(async () => {
    const sb = sbRef.current;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setOwned(new Set()); return; }
    const { data, error: err } = await sb
      .from("cv_template_purchases")
      .select("template_id")
      .eq("user_id", user.id);
    if (err) { setOwned(new Set()); return; }
    setOwned(new Set((data ?? []).map((r) => r.template_id as TemplateId)));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /** Redirects to Dodo checkout for this template. `returnUrl` is where Dodo sends the user back. */
  const unlock = useCallback(async (templateId: TemplateId, returnUrl: string) => {
    setError(null);
    setUnlocking(templateId);
    try {
      const sb = sbRef.current;
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(returnUrl)}`;
        return;
      }
      const res = await fetch("/api/dodo/create-session", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          productId: CV_TEMPLATE_PRODUCTS[templateId],
          metadata:  { purpose: "cv_template", template_id: templateId },
          returnUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.paymentLink) {
        setError(json.error ?? "Impossible de démarrer le paiement.");
        setUnlocking(null);
        return;
      }
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ templateId, paymentId: json.paymentId }));
      window.location.href = json.paymentLink;
    } catch (e) {
      setError((e as Error).message);
      setUnlocking(null);
    }
  }, []);

  /**
   * Call on mount of the page Dodo redirects back to. Polls the payment's
   * real status (not just the presence of ?paid=true) before trusting it,
   * then refreshes entitlements. Returns the unlocked template id so the
   * caller can auto-select it, or null if there was nothing to resume.
   */
  const resumeAfterPayment = useCallback(async (): Promise<TemplateId | null> => {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    let pending: { templateId: TemplateId; paymentId?: string };
    try { pending = JSON.parse(raw); } catch { return null; }
    if (!pending.paymentId) return null;

    // Poll briefly — the webhook may land a few seconds after redirect.
    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await fetch(`/api/dodo/check-payment?payment_id=${encodeURIComponent(pending.paymentId)}`);
      const json = await res.json().catch(() => ({}));
      if (json.status === "succeeded") {
        await refresh();
        return pending.templateId;
      }
      if (json.status === "failed" || json.status === "cancelled") return null;
      await new Promise((r) => setTimeout(r, 1200));
    }
    // Timed out waiting — refresh anyway in case the webhook already landed.
    await refresh();
    return null;
  }, [refresh]);

  return { owned, unlocking, error, unlock, refresh, resumeAfterPayment };
}
