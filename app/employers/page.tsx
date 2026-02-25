import { Check, Zap, Users, BarChart3, Rocket } from 'lucide-react';

export default function EmployerLanding() {
  const plans = [
    {
      name: "Basique",
      price: "0",
      features: ["1 Offre d'emploi", "Visibilité standard", "Gestion des candidatures", "7 Jours en ligne"],
      cta: "Commencer Gratuitement",
      popular: false
    },
    {
      name: "Premium",
      price: "490",
      features: ["3 Offres d'emploi", "Mise en avant (Featured)", "Logo entreprise en couleur", "30 Jours en ligne", "Statistiques de clics"],
      cta: "Choisir Premium",
      popular: true
    },
    {
      name: "Entreprise",
      price: "Sur Devis",
      features: ["Offres illimitées", "Support dédié 24/7", "Intégration API n8n", "Accès à la CVthèque", "Badge 'Entreprise Vérifiée'"],
      cta: "Contacter Sales",
      popular: false
    }
  ];

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="bg-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-6 inline-block">Espace Recruteur</span>
          <h1 className="text-5xl font-black mb-6 leading-tight">La solution n°1 pour recruter au Maroc.</h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Touchez plus de 50,000 candidats qualifiés chaque mois grâce à notre technologie de ciblage intelligent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/login" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-blue-900/20">
              Publier une offre maintenant
            </a>
          </div>
        </div>
      </section>

      {/* Stats / Why Us */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto"><Users size={32} /></div>
            <h3 className="text-xl font-bold">Audience Qualifiée</h3>
            <p className="text-slate-500">Accédez à des profils issus des meilleures écoles et entreprises du Maroc.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto"><Zap size={32} /></div>
            <h3 className="text-xl font-bold">Recrutement Rapide</h3>
            <p className="text-slate-500">Recevez vos premières candidatures pertinentes en moins de 24 heures.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto"><BarChart3 size={32} /></div>
            <h3 className="text-xl font-bold">Analyse en Temps Réel</h3>
            <p className="text-slate-500">Suivez la performance de vos annonces avec notre tableau de bord intuitif.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">Des tarifs adaptés à vos besoins</h2>
            <p className="text-slate-500">Pas de frais cachés. Annulez à tout moment.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-white p-8 rounded-3xl border ${plan.popular ? 'border-blue-600 shadow-2xl scale-105' : 'border-slate-200'} relative`}>
                {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Le plus populaire</span>}
                <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-slate-400 font-bold">MAD</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <Check size={18} className="text-emerald-500" /> {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 text-center">
        <h2 className="text-3xl font-black mb-8 flex items-center justify-center gap-3">
          Prêt à trouver votre perle rare ? <Rocket className="text-blue-600" />
        </h2>
        <a href="/auth/login" className="inline-block bg-blue-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform">
          Créer un compte recruteur
        </a>
      </section>
    </div>
  );
}