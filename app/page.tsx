import { createClient } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { Search, MapPin, Briefcase, Globe, Clock } from 'lucide-react';

// This component handles the data fetching with filters
async function JobList({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const query = params.q || ''; // Search keyword
  const location = params.l || ''; // City/Location

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  // Build the Supabase query dynamically
  let supabaseQuery = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply keyword filter (matches title or company)
  if (query) {
    supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,company.ilike.%${query}%`);
  }

  // Apply location filter
  if (location) {
    supabaseQuery = supabaseQuery.ilike('city', `%${location}%`);
  }

  const { data: jobs, error } = await supabaseQuery;

  if (error) return <div className="text-center py-10 text-red-500">Erreur: {error.message}</div>;

  return (
    <div className="space-y-4">
      {jobs && jobs.length > 0 ? (
        jobs.map((job: any) => (
          <div key={job.id} className="group bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              <a 
                href={job.original_url} 
                target="_blank" 
                className="text-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Postuler
              </a>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-500 font-medium italic">Aucune offre ne correspond à votre recherche.</p>
          <a href="/" className="text-blue-600 font-bold mt-2 inline-block">Voir toutes les offres</a>
        </div>
      )}
    </div>
  );
}

export default function Index({ searchParams }: { searchParams: any }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header / Search Form */}
      <header className="bg-white border-b border-slate-200 pt-10 pb-12 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">T</div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Talent<span className="text-blue-600">Maroc</span></h1>
          </div>
          
          <form action="/" method="GET" className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-200 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 py-3 gap-3 border-b md:border-b-0 md:border-r border-slate-100">
              <Search size={20} className="text-slate-400" />
              <input name="q" type="text" placeholder="Poste ou mot-clé" className="w-full outline-none text-slate-800 font-medium" />
            </div>
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <MapPin size={20} className="text-slate-400" />
              <input name="l" type="text" placeholder="Ville (ex: Tanger)" className="w-full outline-none text-slate-800 font-medium" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
              Rechercher
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Villes Populaires</h3>
            <div className="flex flex-wrap md:flex-col gap-2 md:gap-3">
              {['Casablanca', 'Tanger', 'Rabat', 'Marrakech', 'Agadir'].map(city => (
                <a 
                  key={city} 
                  href={`/?l=${city}`} 
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 bg-white md:bg-transparent px-3 py-1.5 md:p-0 rounded-full border border-slate-100 md:border-0"
                >
                  {city}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Listings Section */}
        <section className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Offres en vedette</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Globe size={14} /> Maroc
            </div>
          </div>

          <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-32 bg-slate-200 rounded-xl"/><div className="h-32 bg-slate-200 rounded-xl"/></div>}>
  <JobList searchParams={searchParams} />
</Suspense>
        </section>
      </div>
    </div>
  );
}