"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

function getSB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const IS: React.CSSProperties = {
  border: "1.5px solid #ede9fe", borderRadius: 10, padding: "12px 14px",
  width: "100%", fontSize: 14, fontFamily: "inherit", color: "#1e1147",
  background: "#faf9ff", outline: "none",
};

export default function AuthLoginPage() {
  const [mode,       setMode]       = useState<"login" | "signup">("login");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [name,       setName]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState("/dashboard");
  const [fromJob,    setFromJob]    = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const r = p.get("redirect") || "/dashboard";
    setRedirectTo(r);
    setFromJob(r.startsWith("/jobs/"));

    // Already logged in → go to correct dashboard based on role
    getSB().auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const role = user.user_metadata?.role;
      if (role === "employer") {
        window.location.href = "/employeur/dashboard";
      } else {
        window.location.href = r;
      }
    });

    // Global logout listener — sync state across tabs
    const { data: { subscription } } = getSB().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        getSB().auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          const role = user.user_metadata?.role;
          window.location.href = role === "employer" ? "/employeur/dashboard" : r;
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (!email || !password) { setError("Email et mot de passe requis."); return; }
    setLoading(true); setError(null);
    try {
      const sb = getSB();
      if (mode === "login") {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Redirect employer accounts to employer dashboard
        const role = data.user?.user_metadata?.role;
        if (role === "employer") {
          window.location.href = "/employeur/dashboard";
        } else {
          window.location.href = redirectTo;
        }
      } else {
        if (password.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        const { data, error } = await sb.auth.signUp({
          email, password,
          options: { data: { name: name || email.split("@")[0], role: "candidate" } },
        });
        if (error) throw error;
        if (!data.session) {
          setError("✉️ Email de confirmation envoyé à " + email + ". Vérifiez votre boîte mail (et les spams) puis revenez vous connecter.");
          setLoading(false);
          return;
        }
        window.location.href = redirectTo;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#1e1147;color:#0f172a}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .au{animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both}
        input:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.12)!important;outline:none!important}
        input{transition:border-color .18s,box-shadow .18s}
        @media(max-width:480px){
          .au{width:100%}
          input{font-size:16px!important}
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#1e1147 0%,#3b1fa3 100%)", display: "flex", flexDirection: "column" }}>
        <nav style={{ padding: "0 24px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: "white", border: "1.5px solid rgba(255,255,255,0.2)" }}>T</div>
            <div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 15, lineHeight: 1 }}>TalentMaroc</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: "0.05em" }}>A WORLD OF OPPORTUNITY</div>
            </div>
          </a>
          <a href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
            ← Retour aux offres
          </a>
        </nav>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px 48px" }}>
          <div className="au" style={{ width: "100%", maxWidth: 440 }}>

            {fromJob && (
              <div style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "16px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, background: "rgba(245,158,11,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💼</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 3 }}>Connexion requise pour postuler</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.5 }}>
                    Connectez-vous ou créez un compte gratuit. Vous serez redirigé(e) automatiquement vers l'offre après la connexion.
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
              <div style={{ padding: "32px 28px 8px" }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 5, color: "#1e1147" }}>
                  {mode === "login" ? "Connexion" : "Créer un compte"}
                </h1>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>
                  {mode === "login"
                    ? "Accédez à votre espace candidat TalentMaroc."
                    : "Rejoignez TalentMaroc gratuitement et gérez vos candidatures."}
                </p>

                <div style={{ display: "flex", gap: 4, background: "#f5f3ff", borderRadius: 12, padding: 4, marginBottom: 22 }}>
                  {(["login", "signup"] as const).map(m => (
                    <button key={m} onClick={() => { setMode(m); setError(null); }}
                      style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .18s",
                        background: mode === m ? "white" : "transparent",
                        color: mode === m ? "#6d28d9" : "#9ca3af",
                        boxShadow: mode === m ? "0 2px 8px rgba(109,40,217,.12)" : "none" }}>
                      {m === "login" ? "Connexion" : "Inscription"}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {mode === "signup" && (
                    <Field label="Prénom et Nom">
                      <input style={IS} placeholder="Youssef Benali" value={name}
                        onChange={e => setName(e.target.value)} />
                    </Field>
                  )}
                  <Field label="Email" required>
                    <input type="email" style={IS} placeholder="youssef@email.ma" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && submit()} />
                  </Field>
                  <Field label="Mot de passe" required>
                    <input type="password" style={IS}
                      placeholder={mode === "signup" ? "Minimum 6 caractères" : "••••••••"}
                      value={password} onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && submit()} />
                  </Field>

                  {error && (
                    <div style={{
                      background: error.startsWith("✉️") ? "#f5f3ff" : "#fef2f2",
                      border: `1.5px solid ${error.startsWith("✉️") ? "#ddd6fe" : "#fecaca"}`,
                      borderRadius: 10, padding: "10px 14px", fontSize: 13,
                      color: error.startsWith("✉️") ? "#6d28d9" : "#dc2626",
                      lineHeight: 1.6,
                    }}>
                      {error}
                    </div>
                  )}

                  <button disabled={loading} onClick={submit}
                    style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white", padding: "14px", borderRadius: 12, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all .18s", marginTop: 4, boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>
                    {loading ? "…" : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
                  </button>

                  {mode === "login" && (
                    <a href="/auth/forgot-password" style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>
                      Mot de passe oublié ?
                    </a>
                  )}

                  {mode === "signup" && (
                    <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.6 }}>
                      En créant un compte vous acceptez nos <a href="/terms" style={{ color: "#7c3aed" }}>CGU</a> et notre <a href="/privacy" style={{ color: "#7c3aed" }}>politique de confidentialité</a>.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ padding: "16px 28px", background: "#f5f3ff", borderTop: "1.5px solid #ede9fe", textAlign: "center" }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>Vous recrutez ? </span>
                <a href="/employeur" style={{ fontSize: 13, color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>Espace recruteur →</a>
              </div>
            </div>
          </div>
        </div>

        <footer style={{ padding: "16px 24px", textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.2)" }}>© 2026 Talent Maroc · A World of Opportunity</span>
        </footer>
      </div>
    </>
  );
}
