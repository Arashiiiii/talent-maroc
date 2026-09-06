-- ============================================================
-- TalentMaroc — Per-template CV purchases (Dodo Payments)
-- Run in Supabase SQL Editor (Database > SQL Editor)
--
-- Each of the 10 CV templates is now a standalone paid unlock.
-- A row here means the user has permanent access to that template.
-- Rows are written ONLY by the Dodo webhook (service role, bypasses RLS)
-- after a confirmed payment.succeeded — never by the client directly.
-- ============================================================

CREATE TABLE IF NOT EXISTS cv_template_purchases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id     text NOT NULL,
  dodo_payment_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_cv_template_purchases_user
  ON cv_template_purchases (user_id);

ALTER TABLE cv_template_purchases ENABLE ROW LEVEL SECURITY;

-- Users may only read their own entitlements.
CREATE POLICY "Users can read own template purchases"
ON cv_template_purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy for authenticated/anon on purpose —
-- only the service-role key (used by the Dodo webhook) can grant entitlements.
