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
  border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "11px 14px",
  width: "100%", fontSize: 14, fontFamily: "inherit", color: "#0f172a",
  background: "white", outline: "none",
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
          setError("Email de confirmation envoyé. Vérifiez votre boîte mail puis reconnectez-vous.");
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f8fafc;color:#0f172a}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
      `}</style>
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        <div className="au" style={{ background: "white", border: "1.5px solid #f0f0f0", borderRadius: 18, padding: "40px 36px", maxWidth: 480, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,.06)", textAlign: "center" }}>

          {/* Icon */}
          <div style={{ width: 64, height: 64, background: "#fef3c7", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>
            🏢
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
            Espace Recruteurs
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 8 }}>
            Vous êtes connecté(e) en tant que <strong style={{ color: "#0f172a" }}>{candidateUser.email}</strong> (compte candidat).
          </p>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>
            L'espace recruteurs nécessite un <strong style={{ color: "#0f172a" }}>compte employeur séparé</strong>. Les deux espaces sont indépendants pour protéger vos données.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Primary: create employer account (sign out first) */}
            <button
              onClick={async () => {
                await getSB().auth.signOut();
                setMode("signup");
                setCandidateUser(null);
              }}
              style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 10, padding: "13px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Créer un compte employeur
            </button>

            {/* Secondary: login with existing employer account */}
            <button
              onClick={async () => {
                await getSB().auth.signOut();
                setMode("login");
                setCandidateUser(null);
              }}
              style={{ background: "white", color: "#374151", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "13px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              J'ai déjà un compte employeur — Se connecter
            </button>

            {/* Return to candidate dashboard */}
            <a href="/dashboard"
              style={{ display: "block", fontSize: 13, color: "#9ca3af", textDecoration: "none", marginTop: 4, padding: "8px" }}>
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f8fafc;color:#0f172a}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
        input:focus{border-color:#16a34a!important;box-shadow:0 0 0 3px rgba(22,163,74,.1)!important;outline:none!important}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
        <nav style={{ background: "rgba(255,255,255,.96)", backdropFilter: "blur(12px)", borderBottom: "1.5px solid #f0f0f0", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, background: "#16a34a", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "white" }}>T</div>
            <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 16 }}>TalentMaroc</span>
          </a>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/pricing" style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, textDecoration: "none" }}>Tarifs</a>
            <a href="/auth/login" style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, textDecoration: "none" }}>Espace candidat →</a>
          </div>
        </nav>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
          <div className="au" style={{ width: "100%", maxWidth: 480 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 100, padding: "6px 16px", marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>Espace Recruteur</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
                {mode === "login" ? "Connexion Recruteur" : "Créer un compte Recruteur"}
              </h1>
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                {mode === "login"
                  ? "Accédez à votre dashboard de recrutement."
                  : "Publiez vos offres et gérez vos candidatures."}
              </p>
            </div>

            <div style={{ background: "white", border: "1.5px solid #f0f0f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}>
              <div style={{ padding: "28px 28px 24px" }}>
                <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 22 }}>
                  {(["login", "signup"] as const).map(m => (
                    <button key={m} onClick={() => { setMode(m); setError(null); }}
                      style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .18s",
                        background: mode === m ? "white" : "transparent", color: mode === m ? "#0f172a" : "#6b7280",
                        boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,.1)" : "none" }}>
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
                    <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", lineHeight: 1.5 }}>
                      ⚠ {error}
                    </div>
                  )}

                  <button disabled={loading} onClick={submit}
                    style={{ background: "#16a34a", color: "white", padding: "13px", borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all .18s", marginTop: 4 }}>
                    {loading ? "…" : mode === "login" ? "Accéder au dashboard →" : "Créer mon espace recruteur →"}
                  </button>

                  {mode === "signup" && (
                    <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.6 }}>
                      En créant un compte vous acceptez nos <a href="/terms" style={{ color: "#16a34a" }}>CGU</a> et notre <a href="/privacy" style={{ color: "#16a34a" }}>politique de confidentialité</a>.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ padding: "14px 28px", background: "#f9fafb", borderTop: "1.5px solid #f0f0f0", textAlign: "center" }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>Vous cherchez un emploi ? </span>
                <a href="/auth/login" style={{ fontSize: 13, color: "#16a34a", fontWeight: 700, textDecoration: "none" }}>Espace candidat →</a>
              </div>
            </div>
          </div>
        </div>

        <footer style={{ background: "#0f172a", padding: "16px 24px", textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>© 2026 Talent Maroc · Recruteurs</span>
        </footer>
      </div>
    </>
  );
}
