"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

function getSB() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

export default function EmployeurPage() {
  const [mode,          setMode]         = useState<"login" | "signup">("login");
  const [email,         setEmail]        = useState("");
  const [password,      setPassword]     = useState("");
  const [name,          setName]         = useState("");
  const [company,       setCompany]      = useState("");
  const [phone,         setPhone]        = useState("");
  const [loading,       setLoading]      = useState(false);
  const [checking,      setChecking]     = useState(true);
  const [error,         setError]        = useState<string | null>(null);
  const [candidateUser, setCandidateUser]= useState<any>(null); // logged-in candidate trying to access employer space

  useEffect(() => {
    getSB().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const role = user.user_metadata?.role;
        if (role === "candidate") {
          // Candidate trying to access employer space — show prompt
          setCandidateUser(user);
          setChecking(false);
        } else {
          window.location.href = "/employeur/dashboard";
        }
      } else {
        setChecking(false);
      }
    });

    // Global logout listener — if signed out from another tab, redirect here
    const { data: { subscription } } = getSB().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setChecking(false);
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
        const role = data.user?.user_metadata?.role;
        if (role === "candidate") {
          await sb.auth.signOut();
          throw new Error("Ce compte est un compte candidat. Utilisez la page de connexion candidat.");
        }
        if (!role) {
          await sb.auth.updateUser({ data: { role: "employer" } });
        }
        window.location.href = "/employeur/dashboard";
      } else {
        if (!name.trim() || !company.trim()) throw new Error("Nom et entreprise requis.");
        if (password.length < 6) throw new Error("Mot de passe minimum 6 caractères.");
        const { data, error } = await sb.auth.signUp({
          email, password,
          options: { data: { name: name.trim(), company_name: company.trim(), phone: phone.trim(), role: "employer" } },
        });
        if (error) throw error;
        if (!data.session) {
          setError("✉️ Email de confirmation envoyé à " + email + ". Vérifiez votre boîte mail (et les spams) puis revenez vous connecter.");
          setLoading(false); return;
        }
        window.location.href = "/employeur/dashboard";
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Candidate is logged in — show a prompt to create a separate employer account
  if (candidateUser) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#1e1147;color:#0f172a}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
      `}</style>
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#1e1147 0%,#3b1fa3 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        <div className="au" style={{ background: "white", borderRadius: 20, padding: "40px 36px", maxWidth: 480, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,.3)", textAlign: "center" }}>

          <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px", border: "2px solid #ddd6fe" }}>
            🏢
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e1147", marginBottom: 10 }}>
            Espace Recruteurs
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 8 }}>
            Vous êtes connecté(e) en tant que <strong style={{ color: "#1e1147" }}>{candidateUser.email}</strong> (compte candidat).
          </p>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>
            L'espace recruteurs nécessite un <strong style={{ color: "#1e1147" }}>compte employeur séparé</strong>. Les deux espaces sont indépendants pour protéger vos données.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={async () => { await getSB().auth.signOut(); setMode("signup"); setCandidateUser(null); }}
              style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(124,58,237,.35)" }}>
              Créer un compte employeur
            </button>
            <button
              onClick={async () => { await getSB().auth.signOut(); setMode("login"); setCandidateUser(null); }}
              style={{ background: "white", color: "#6d28d9", border: "1.5px solid #ddd6fe", borderRadius: 12, padding: "14px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              J'ai déjà un compte employeur — Se connecter
            </button>
            <a href="/dashboard" style={{ display: "block", fontSize: 13, color: "#9ca3af", textDecoration: "none", marginTop: 4, padding: "8px" }}>
              ← Retour à mon espace candidat
            </a>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#1e1147;color:#0f172a}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both}
        input:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.12)!important;outline:none!important}
        input{transition:border-color .18s,box-shadow .18s}
        @media(max-width:480px){.au{width:100%}input{font-size:16px!important}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#1e1147 0%,#3b1fa3 100%)", display: "flex", flexDirection: "column" }}>
        <nav style={{ padding: "0 24px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/logo.png" alt="TalentMaroc" style={{ height:110, width:'auto', objectFit:'contain', filter:'brightness(0) invert(1)', opacity:0.92, margin:'-22px 0' }} />
          </a>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/pricing" style={{ fontSize: 13, color: "rgba(255,255,255,.6)", fontWeight: 600, textDecoration: "none" }}>Tarifs</a>
            <a href="/auth/login" style={{ fontSize: 13, color: "rgba(255,255,255,.6)", fontWeight: 600, textDecoration: "none" }}>Espace candidat →</a>
          </div>
        </nav>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px 48px" }}>
          <div className="au" style={{ width: "100%", maxWidth: 480 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 100, padding: "6px 16px", marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Espace Recruteur</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: "white" }}>
                {mode === "login" ? "Connexion Recruteur" : "Créer un compte Recruteur"}
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>
                {mode === "login" ? "Accédez à votre dashboard de recrutement." : "Publiez vos offres et gérez vos candidatures."}
              </p>
            </div>

            <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
              <div style={{ padding: "28px 28px 24px" }}>
                <div style={{ display: "flex", gap: 4, background: "#f5f3ff", borderRadius: 12, padding: 4, marginBottom: 22 }}>
                  {(["login", "signup"] as const).map(m => (
                    <button key={m} onClick={() => { setMode(m); setError(null); }}
                      style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .18s",
                        background: mode === m ? "white" : "transparent", color: mode === m ? "#6d28d9" : "#9ca3af",
                        boxShadow: mode === m ? "0 2px 8px rgba(109,40,217,.12)" : "none" }}>
                      {m === "login" ? "Connexion" : "Inscription"}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {mode === "signup" && (
                    <>
                      <Field label="Nom et prénom" required>
                        <input style={IS} placeholder="Khadija Alaoui" value={name} onChange={e => setName(e.target.value)} />
                      </Field>
                      <Field label="Nom de l'entreprise" required>
                        <input style={IS} placeholder="Maroc Telecom" value={company} onChange={e => setCompany(e.target.value)} />
                      </Field>
                      <Field label="Téléphone (optionnel)">
                        <input style={IS} placeholder="+212 6XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
                      </Field>
                    </>
                  )}
                  <Field label="Email professionnel" required>
                    <input type="email" style={IS} placeholder="rh@entreprise.ma" value={email}
                      onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
                  </Field>
                  <Field label="Mot de passe" required>
                    <input type="password" style={IS} placeholder={mode === "signup" ? "Minimum 6 caractères" : "••••••••"}
                      value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
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
                    style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white", padding: "14px", borderRadius: 12, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all .18s", marginTop: 4, boxShadow: "0 4px 16px rgba(124,58,237,.35)" }}>
                    {loading ? "…" : mode === "login" ? "Accéder au dashboard →" : "Créer mon espace recruteur →"}
                  </button>

                  {mode === "signup" && (
                    <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.6 }}>
                      En créant un compte vous acceptez nos <a href="/terms" style={{ color: "#7c3aed" }}>CGU</a> et notre <a href="/privacy" style={{ color: "#7c3aed" }}>politique de confidentialité</a>.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ padding: "16px 28px", background: "#f5f3ff", borderTop: "1.5px solid #ede9fe", textAlign: "center" }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>Vous cherchez un emploi ? </span>
                <a href="/auth/login" style={{ fontSize: 13, color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>Espace candidat →</a>
              </div>
            </div>
          </div>
        </div>

        <footer style={{ padding: "16px 24px", textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.2)" }}>© 2026 Talent Maroc · Recruteurs</span>
        </footer>
      </div>
    </>
  );
}
