import { createClient } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { Search, MapPin, Briefcase, Globe, Clock } from 'lucide-react';

// 1. Data Fetching Component with Filter Logic
async function JobList({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const query = params.q || '';
  const location = params.l || '';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Manual client to ensure environment variables are read correctly at runtime
  const supabase = createClient(url, key);

  let supabaseQuery = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply Search Filters
  if (query) {
    supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,company.ilike.%${query}%`);
  }
  if (location) {
    supabaseQuery = supabaseQuery.ilike('city', `%${location}%`);
  }

  const { data: jobs, error } = await supabaseQuery;

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600">
        Erreur de base de données: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs && jobs.length > 0 ? (
        jobs.map((job: any) => (
          <div key={job.id} className="group bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all">
            <div className="flex flex-col md:flex-row gap-5">
              
              {/* Logo Section */}
              <div className="flex-shrink-0">
                {job.logo_url ? (
                  <img 
                    src={job.logo_url} 
                    alt={job.company} 
                    className="w-14 h-14 rounded-lg object-contain border border-slate-100 bg-slate-50 p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${job.company}&background=random`;
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100">
                    {job.company?.charAt(0) || 'J'}
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h2>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2 text-slate-600 text-sm">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Briefcase size={16} className="text-slate-400" />
                    {job.company}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-slate-400" />
                    {job.city}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={16} />
                    {new Date(job.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              {/* Action Section */}
              <div className="flex items-center justify-end">
                <a 
                  href={job.original_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full md:w-auto text-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Postuler
                </a>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-500 font-medium italic">Aucune offre trouvée pour votre recherche.</p>
          <a href="/" className="text-blue-600 font-bold mt-2 inline-block hover:underline">Voir toutes les offres</a>
        </div>
      )}
    </div>
  );
}

// 2. Main Page Layout Component
export default function Index({ searchParams }: { searchParams: any }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Search Header */}
      <header className="bg-white border-b border-slate-200 pt-12 pb-14 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-10 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">T</div>
            <h1 className="text-3xl font-black tracking-tight">Talent<span className="text-blue-600">Maroc</span></h1>
          </div>
          
          <form action="/" method="GET" className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-200 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 py-3 gap-3 border-b md:border-b-0 md:border-r border-slate-100">
              <Search size={20} className="text-slate-400" />
              <input name="q" type="text" placeholder="Poste ou mot-clé" className="w-full outline-none font-medium placeholder:text-slate-300" />
            </div>
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <MapPin size={20} className="text-slate-400" />
              <input name="l" type="text" placeholder="Ville (ex: Tanger)" className="w-full outline-none font-medium placeholder:text-slate-300" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95">
              Rechercher
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-10">
        
        {/* Left Sidebar Filters */}
        <aside className="w-full md:w-56 space-y-10">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-5">Villes Populaires</h3>
            <div className="flex flex-wrap md:flex-col gap-2 md:gap-4">
              {['Casablanca', 'Tanger', 'Rabat', 'Marrakech', 'Agadir'].map(city => (
                <a 
                  key={city} 
                  href={`/?l=${city}`} 
                  className="text-[15px] font-semibold text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all inline-block"
                >
                  {city}
                </a>
              ))}
            </div>
          </div>
          <div className="p-5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100">
            <h4 className="font-bold mb-2">Alerte Emploi</h4>
            <p className="text-xs text-blue-100 mb-4 leading-relaxed">Recevez les nouveaux jobs par email dès qu'ils arrivent.</p>
            <button className="w-full bg-white text-blue-600 py-2 rounded-lg text-sm font-bold">Activer</button>
          </div>
        </aside>

        {/* Results Section */}
        <section className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Offres d'emploi au Maroc</h2>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded">
              <Globe size={12} /> Actualisé Directement
            </div>
          </div>

          <Suspense fallback={
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-32 w-full bg-white rounded-xl border border-slate-100 animate-pulse" />
    ))}
  </div>
}>
  <JobList searchParams={searchParams} />
</Suspense>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-16 text-center">
        <p className="text-slate-400 text-sm">© 2026 Talent Maroc — La plateforme de recrutement n°1</p>
      </footer>
    </div>
  );
}