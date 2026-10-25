import Link from "next/link";
import { notFound } from "next/navigation";
import SeoShell, { C, CVCta } from "@/components/seo/SeoShell";
import { CV_GUIDES, getGuide } from "@/lib/cv-guides";
import { SITE_URL, SITE_NAME, jsonLd, breadcrumb, faqPage } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return CV_GUIDES.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  const url = `${SITE_URL}/conseils-cv/${g.slug}`;
  return {
    title: g.title,
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: url },
    openGraph: { title: g.title, description: g.description, url, type: "article", locale: "fr_MA" },
    twitter: { card: "summary_large_image", title: g.title, description: g.description },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const url = `${SITE_URL}/conseils-cv/${g.slug}`;
  const others = CV_GUIDES.filter(o => o.slug !== g.slug).slice(0, 4);
  const updated = new Date(g.updated).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.h1,
      description: g.description,
      inLanguage: "fr-MA",
      dateModified: g.updated,
      datePublished: g.updated,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
    },
    breadcrumb([
      { name: "Accueil", url: SITE_URL },
      { name: "Conseils CV", url: `${SITE_URL}/conseils-cv` },
      { name: g.h1, url },
    ]),
    faqPage(g.faq),
  ];

  return (
    <SeoShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <article style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px 0" }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
          <Link href="/" style={{ color: C.muted }}>Accueil</Link> › <Link href="/conseils-cv" style={{ color: C.muted }}>Conseils CV</Link>
        </nav>
        <h1 style={{ fontSize: "clamp(28px,4.4vw,40px)", fontWeight: 800, color: C.ink, lineHeight: 1.12, letterSpacing: "-.03em", margin: "0 0 12px" }}>{g.h1}</h1>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>Mis à jour le {updated} · Talent Maroc</div>

        <div className="seo-prose">
          <p style={{ fontSize: 18, lineHeight: 1.7, color: C.ink }}>{g.intro}</p>

          <CVCta
            title="Appliquez ces conseils en 5 minutes"
            text="Choisissez un modèle, remplissez les rubriques, et laissez l'IA reformuler vos expériences en français, anglais ou arabe."
            template={g.template}
          />

          {g.sections.map(s => (
            <section key={s.h2}>
              <h2>{s.h2}</h2>
              {s.p.map((para, i) => <p key={i}>{para}</p>)}
              {s.list && <ul>{s.list.map((li, i) => <li key={i}>{li}</li>)}</ul>}
            </section>
          ))}

          <h2>Questions fréquentes</h2>
          {g.faq.map(f => (
            <details key={f.q} style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
              <summary style={{ fontWeight: 700, color: C.ink, cursor: "pointer", fontSize: 16 }}>{f.q}</summary>
              <p style={{ margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>

        <CVCta
          title="Votre CV, prêt à envoyer aujourd'hui"
          text="Importez votre ancien CV (PDF ou Word) ou partez d'un modèle. Aucun compte requis pour commencer."
        />

        {g.jobsLink && (
          <p style={{ fontSize: 15 }}>
            CV prêt ? <Link href={g.jobsLink.href} style={{ color: C.violet, fontWeight: 700 }}>{g.jobsLink.label} →</Link>
          </p>
        )}

        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: "36px 0 14px" }}>Autres conseils CV</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {others.map(o => (
            <Link key={o.slug} href={`/conseils-cv/${o.slug}`} className="seo-card">
              <div style={{ fontWeight: 700, color: C.ink, fontSize: 15, marginBottom: 4 }}>{o.h1.split(":")[0]}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{o.description.slice(0, 90)}…</div>
            </Link>
          ))}
        </div>
      </article>
    </SeoShell>
  );
}
