import { createClient } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { Search, MapPin, Briefcase, Globe } from 'lucide-react';

async function JobList() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <div className="text-center py-10 text-red-500">Erreur de chargement.</div>;

  return (
    <div className="space-y-4">
      {jobs?.map((job: any) => (
        <div key={job.id} className="group bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Nouveau</span>
                <span className="text-xs text-slate-400 font-medium">Il y a 2h</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {job.title}
              </h2>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2 text-slate-600 text-sm">
                <div className="flex items-center gap-1.5">
                  <Briefcase size={16} className="text-slate-400" />
                  <span className="font-semibold">{job.company}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-slate-400" />
                  <span>{job.city}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href={job.original_url} 
                target="_blank" 
                className="w-full md:w-auto text-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Postuler
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Professional Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">T</div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Talent<span className="text-blue-600">Maroc</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#" className="hover:text-blue-600">Rechercher</a>
            <a href="#" className="hover:text-blue-600">Entreprises</a>
            <a href="#" className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">Publier une offre</a>
          </div>
        </div>
      </nav>

      {/* Hero / Search Section */}
      <header className="bg-white border-b border-slate-200 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Trouvez votre prochain défi au Maroc.
          </h1>
          <p className="text-lg text-slate-600 mb-10">Recherchez parmi des milliers d'opportunités d'emploi actualisées.</p>
          
          <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 py-3 gap-3 border-b md:border-b-0 md:border-r border-slate-100">
              <Search size={20} className="text-slate-400" />
              <input type="text" placeholder="Poste, mots-clés..." className="w-full outline-none text-slate-800 font-medium" />
            </div>
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <MapPin size={20} className="text-slate-400" />
              <input type="text" placeholder="Ville ou région" className="w-full outline-none text-slate-800 font-medium" />
            </div>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              Rechercher
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block w-64 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Villes populaires</h3>
            <div className="space-y-2 text-sm text-slate-600 font-medium">
              <p className="hover:text-blue-600 cursor-pointer">Casablanca</p>
              <p className="hover:text-blue-600 cursor-pointer">Tangier</p>
              <p className="hover:text-blue-600 cursor-pointer">Rabat</p>
              <p className="hover:text-blue-600 cursor-pointer">Marrakech</p>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Dernières offres d'emploi</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <Globe size={14} /> Maroc Entier
            </div>
          </div>

          <Suspense fallback={
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 w-full bg-white rounded-xl animate-pulse border border-slate-100" />
              ))}
            </div>
          }>
            <JobList />
          </Suspense>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-12 text-center text-slate-400 text-sm">
        <p>© 2026 Talent Maroc — Propulsé par n8n & Supabase</p>
      </footer>
    </div>
  );
}