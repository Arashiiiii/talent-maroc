"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const type   = params.get("type") || "cv"; // cv | ai | recruteur

  const config: Record<string, { icon: string; title: string; subtitle: string; cta: string; href: string }> = {
    cv: {
      icon:     "🎉",
      title:    "Votre CV est prêt !",
      subtitle: "Paiement confirmé. Retournez à l'éditeur pour télécharger votre CV en PDF.",
      cta:      "Télécharger mon CV",
      href:     "/cv?paid=true",
    },
    ai: {
      icon:     "✨",
      title:    "Paiement confirmé !",
      subtitle: "Votre outil IA est débloqué. Retournez à votre espace pour générer votre contenu.",
      cta:      "Accéder à mon espace",
      href:     "/dashboard?tab=outils&paid=true",
    },
    recruteur: {
      icon:     "🚀",
      title:    "Bienvenue dans Pro Recruteur !",
      subtitle: "Votre abonnement est actif. Accédez maintenant à toutes les fonctionnalités avancées.",
      cta:      "Accéder au dashboard",
      href:     "/employeur/dashboard?upgrade=success",
    },
  };

  const c = config[type] ?? config.cv;
  const [count, setCount] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setCount(n => n - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (count <= 0) window.location.href = c.href;
  }, [count, c.href]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 50%,#ddd6fe 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      padding: 24,
    }}>
      <div style={{
        background: "white",
        borderRadius: 24,
        padding: "56px 48px",
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 24px 64px rgba(124,58,237,.15)",
      }}>
        {/* Checkmark circle */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 8px 24px rgba(124,58,237,.35)",
        }}>
          <span style={{ fontSize: 36 }}>✓</span>
        </div>

        <div style={{ fontSize: 48, marginBottom: 8 }}>{c.icon}</div>

        <h1 style={{
          fontSize: 26, fontWeight: 800, color: "#0f172a",
          marginBottom: 12, lineHeight: 1.2,
        }}>
          {c.title}
        </h1>

        <p style={{
          fontSize: 15, color: "#6b7280", lineHeight: 1.7,
          marginBottom: 32,
        }}>
          {c.subtitle}
        </p>

        <a href={c.href} style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
          color: "white", textDecoration: "none",
          padding: "14px 32px", borderRadius: 12,
          fontSize: 15, fontWeight: 700,
          boxShadow: "0 4px 16px rgba(124,58,237,.35)",
          transition: "all .2s",
        }}>
          {c.cta} →
        </a>

        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 20 }}>
          Redirection automatique dans {count} seconde{count !== 1 ? "s" : ""}…
        </p>

        <div style={{
          marginTop: 32, paddingTop: 24,
          borderTop: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 12, color: "#9ca3af",
        }}>
          <span>🔒</span> Paiement sécurisé via Dodo Payments
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>Chargement…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
