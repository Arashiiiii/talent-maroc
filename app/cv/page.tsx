"use client";
import { useState, useRef } from "react";
import { FileText, Sparkles, Download, RotateCcw, ArrowLeft, Loader2, CheckCircle, CreditCard } from "lucide-react";
import Link from "next/link";

// ── TEMPLATES CONFIG (From your original design) ──
const TEMPLATES = [
  { id: "modern", name: "Moderne", color: "#1a56db" },
  { id: "minimal", name: "Minimaliste", color: "#0f172a" },
  { id: "professional", name: "Professionnel", color: "#057a55" },
];

export default function CVBuilderPage() {
  const [step, setStep] = useState(1); // 1: Input, 2: Template, 3: Preview/Pay
  const [text, setText] = useState("");
  const [generatedCV, setGeneratedCV] = useState("");
  const [selectedTpl, setSelectedTpl] = useState("modern");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // ── THE FIXED AI LOGIC ──
  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 2000,
          messages: [{ 
            role: "user", 
            content: `Tu es un expert en recrutement au Maroc. Reformate ce texte en un CV professionnel structuré (EXPERIENCE, FORMATION, COMPETENCES). Garde un ton pro. Voici les infos : ${text}` 
          }]
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Erreur serveur AI.");
      }

      const data = await response.json();
      if (data?.content?.?.text) {
  setGeneratedCV(data.content.text);
        setStep(2); // Move to template selection after success
      } else {
        throw new Error("Format de réponse invalide.");
      }
    } catch (err: any) {
      console.error("AI Error:", err);
      setError("Erreur de génération. Vérifiez votre clé API dans Vercel.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── RENDER CV LOGIC (Matches your original template styling) ──
  const renderFormattedCV = () => {
    const lines = generatedCV.split('\n');
    const accentColor = TEMPLATES.find(t => t.id === selectedTpl)?.color || "#1a56db";

    return lines.map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} className="h-2" />;
      const isSection = /^[A-ZÉÀÂÙÈÊÎÔ][A-ZÉÀÂÙÈÊÎÔ\s\/&]+$/.test(t) && t.length > 3;

      if (i === 0) return <h1 key={i} className="text-2xl font-black mb-1" style={{ color: accentColor }}>{t}</h1>;
      if (isSection) return <h2 key={i} className="text-lg font-bold mt-4 mb-2 border-b-2 pb-1 uppercase tracking-wide" style={{ color: accentColor, borderColor: accentColor }}>{t}</h2>;
      return <p key={i} className="text-gray-700 text-sm mb-1">{t}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navbar */}
      <nav className="bg-[#0f1d36] text-white p-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft size={16} /> Accueil
          </Link>
          <span className="font-bold">Talent<span className="text-blue-400">Maroc</span> CV</span>
          <div className="flex gap-2">
            {.map((s) => (
              <div key={s} className={`w-2 h-2 rounded-full ${step === s ? 'bg-blue-400' : 'bg-gray-600'}`} />
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {/* STEP 1: INPUT */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-[#0f1d36]">Créez votre CV avec l'IA</h1>
              <p className="text-gray-500 mt-2">Collez vos informations en vrac, nous faisons le reste.</p>
            </div>
            
            <textarea 
              className="w-full h-80 p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all text-gray-700"
              placeholder="Ex: Mohamed Alami, Ingénieur à Tanger... Expérience: 5 ans chez..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {error && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><RotateCcw size={14}/> {error}</p>}

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isGenerating ? <><Loader2 className="animate-spin" /> Analyse par l'IA...</> : <><Sparkles size={20} /> Générer mon CV</>}
            </button>
          </div>
        )}

        {/* STEP 2: SELECT TEMPLATE */}
        {step === 2 && (
          <div className="animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-bold text-center mb-6">Choisissez un style</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {TEMPLATES.map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setSelectedTpl(t.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${selectedTpl === t.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'}`}
                >
                  <div className="w-full h-32 mb-3 rounded shadow-inner" style={{ backgroundColor: t.color }}></div>
                  <span className="font-bold">{t.name}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep(3)}
              className="w-full bg-[#0f1d36] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              Continuer vers l'aperçu <ArrowLeft size={18} className="rotate-180" />
            </button>
          </div>
        )}

        {/* STEP 3: PREVIEW & EXPORT */}
        {step === 3 && (
          <div className="grid md:grid-cols-3 gap-6 animate-in fade-in">
            <div className="md:col-span-2 bg-white p-10 shadow-2xl rounded-sm border border-gray-200 min-h-[800px]">
              {renderFormattedCV()}
            </div>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2">Prêt à télécharger ?</h3>
                <p className="text-sm text-gray-500 mb-4">Votre CV est optimisé pour les recruteurs marocains.</p>
                <button onClick={() => window.print()} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  <Download size={18} /> Télécharger PDF
                </button>
              </div>
              <button onClick={() => setStep(1)} className="w-full text-gray-500 text-sm font-medium hover:underline">
                Modifier les informations
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}