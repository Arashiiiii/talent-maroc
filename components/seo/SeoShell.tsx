import Link from "next/link";
// Shared header/footer for server-rendered SEO landing pages
// (/emploi/*, /conseils-cv/*). Plain links only — no client JS needed.
import { CITY_PAGES } from "@/lib/seo";
import { CV_GUIDES } from "@/lib/cv-guides";

export const C = {
  ink: "#0f172a", body: "#374151", muted: "#6b7280", line: "#eceef2",
  violet: "#7c3aed", violetInk: "#1e1147", soft: "#f5f3ff", bg: "#fafbfc",
};

export default function SeoShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", color: C.body }}>
      <style>{`
        .seo-nav a { color:${C.body}; text-decoration:none; font-size:14px; font-weight:600; padding:6px 10px; border-radius:8px; }
        .seo-nav a:hover { background:${C.soft}; color:${C.violet}; }
        .seo-prose h2 { font-size:clamp(20px,2.6vw,24px); font-weight:800; color:${C.ink}; margin:36px 0 12px; letter-spacing:-.02em; }
        .seo-prose p, .seo-prose li { font-size:16px; line-height:1.75; }
        .seo-prose p { margin:0 0 14px; }
        .seo-prose ul { margin:0 0 16px; padding-left:22px; }
        .seo-prose li { margin-bottom:6px; }
        .seo-card { display:block; background:#fff; border:1.5px solid ${C.line}; border-radius:12px; padding:16px 18px; text-decoration:none; color:inherit; transition:border-color .15s, box-shadow .15s; }
        .seo-card:hover { border-color:#c4b5fd; box-shadow:0 4px 16px rgba(124,58,237,.08); }
        .seo-foot a { display:block; color:rgba(255,255,255,.55); text-decoration:none; font-size:13px; margin-bottom:8px; }
        .seo-foot a:hover { color:#fff; }
        .seo-cta { display:inline-flex; align-items:center; gap:8px; background:${C.violet}; color:#fff; font-weight:700; font-size:15px; padding:13px 22px; border-radius:10px; text-decoration:none; box-shadow:0 8px 24px -8px rgba(124,58,237,.55); }
        .seo-cta:hover { background:#6d28d9; }
        @media (max-width:720px){ .seo-nav .hide-sm{ display:none; } .seo-foot-grid{ grid-template-columns:1fr 1fr !important; } }
      `}</style>

      <header style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/" aria-label="Talent Maroc — accueil" style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="Talent Maroc" style={{ height: 40, width: "auto" }} />
          </Link>
          <nav className="seo-nav" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Link href="/">Emplois</Link>
            <Link href="/conseils-cv" className="hide-sm">Conseils CV</Link>
            <Link href="/employeur" className="hide-sm">Recruteurs</Link>
            <Link href="/cv" style={{ color: C.violet }}>Créer mon CV ✦</Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="seo-foot" style={{ background: C.violetInk, padding: "44px 16px 24px", marginTop: 56 }}>
        <div className="seo-foot-grid" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 24 }}>
          <div>
            <img src="/logo.png" alt="Talent Maroc" style={{ height: 56, width: "auto", filter: "brightness(0) invert(1)", opacity: .85, marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.7, maxWidth: 240, margin: 0 }}>
              Offres d&apos;emploi au Maroc et générateur de CV en ligne.
            </p>
          </div>
          <div>
            <FootTitle>Emploi par ville</FootTitle>
            {CITY_PAGES.slice(0, 6).map(c => <Link key={c.slug} href={`/emploi/${c.slug}`}>Emploi {c.name}</Link>)}
          </div>
          <div>
            <FootTitle>Conseils CV</FootTitle>
            {CV_GUIDES.slice(0, 6).map(g => <Link key={g.slug} href={`/conseils-cv/${g.slug}`}>{g.h1.split(":")[0]}</Link>)}
          </div>
          <div>
            <FootTitle>Talent Maroc</FootTitle>
            <Link href="/cv">Créer mon CV</Link>
            <Link href="/employeur/new">Publier une offre</Link>
            <Link href="/pricing">Tarifs</Link>
            <Link href="/privacy">Confidentialité</Link>
            <Link href="/terms">CGU</Link>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "28px auto 0", borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 16, fontSize: 12, color: "rgba(255,255,255,.3)" }}>
          © {new Date().getFullYear()} Talent Maroc · 🇲🇦 Fait au Maroc
        </div>
      </footer>
    </div>
  );
}

function FootTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>{children}</div>;
}

/** Big CV-builder call-to-action block reused across SEO pages. */
export function CVCta({ title, text, template }: { title: string; text: string; template?: string }) {
  return (
    <section style={{ background: "linear-gradient(135deg,#1e1147,#4c1d95)", borderRadius: 18, padding: "28px 26px", color: "#fff", margin: "32px 0", position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#c4b5fd", marginBottom: 8 }}>Générateur de CV · IA</div>
      <h2 style={{ fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-.02em", color: "#fff" }}>{title}</h2>
      <p style={{ margin: "0 0 18px", color: "rgba(255,255,255,.75)", fontSize: 15, lineHeight: 1.6, maxWidth: 560 }}>
        {text}{template ? <> Modèle conseillé : <strong style={{ color: "#fff" }}>{template}</strong>.</> : null}
      </p>
      <Link href="/cv" className="seo-cta" style={{ background: "#a78bfa", color: "#1e1147" }}>Créer mon CV gratuitement →</Link>
      <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,.55)" }}>Sans compte · 10 modèles compatibles ATS · Export PDF</div>
    </section>
  );
}
