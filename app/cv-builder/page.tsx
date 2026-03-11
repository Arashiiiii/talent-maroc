'use client';
import { useState, useRef } from 'react';
import { FileText, Sparkles, Download, RotateCcw } from 'lucide-react';

export default function CVBuilder() {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Core logic from the provided file
  const handleGenerate = () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
    }, 1500);
  };

  const downloadCV = () => {
    if (!previewRef.current) return;
    const content = previewRef.current.innerText;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "Mon_CV_TalentMaroc.txt";
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Page Hero - Matching your design tokens */}
      <section className="bg-[#0f1d36] py-16 px-6 text-center text-white">
        <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-800 text-blue-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
          <Sparkles size={14} /> AI POWERED
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Créateur de CV <span className="text-blue-400">Intelligent</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Collez vos informations en vrac, notre IA s'occupe de la mise en page professionnelle.
        </p>
      </section>

      <main className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-8 -mt-10">
        {/* Editor Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="text-blue-600" /> Vos informations
            </h2>
          </div>
          <textarea
            className="w-full h-[500px] p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
            placeholder="Nom, Contact, Expériences, Formations..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? 'Génération en cours...' : 'Générer mon CV'}
          </button>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aperçu Professionnel</span>
            {showResult && (
              <div className="flex gap-2">
                <button onClick={handleGenerate} className="p-2 hover:bg-gray-200 rounded-md text-gray-600"><RotateCcw size={18}/></button>
                <button onClick={downloadCV} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-xs font-bold"><Download size={14}/> PDF</button>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto max-h-[600px]" id="cvPreview" ref={previewRef}>
            {!showResult ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} />
                </div>
                <p>Remplissez le formulaire pour voir<br/>votre CV ici</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                {/* Simplified logic for display */}
                {inputText.split('\n').map((line, i) => (
                  <p key={i} className={i === 0 ? "text-2xl font-bold text-[#0f1d36]" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}