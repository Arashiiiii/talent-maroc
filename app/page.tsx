import { createClient } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { Search, MapPin, Briefcase, Globe, Clock, PlusCircle } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo'; // Import the new fix

async function JobList({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const query = params.q || '';
  const location = params.l || '';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  let supabaseQuery = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (query) {
    supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,company.ilike.%${query}%`);
  }
  if (location) {
    supabaseQuery = supabaseQuery.ilike('city', `%${location}%`);
  }

  const { data: jobs, error } = await supabaseQuery;

  if (error) return <div className="p-6 text-red-600">Erreur: {error.message}</div>;

  return (
    <div className="space-y-4">
      {jobs && jobs.length > 0 ? (
        jobs.map((job: any) => (
          <div key={job.id} className="group bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all">
            <div className="flex flex-col md:flex-row gap-5">
              
              {/* FIXED LOGO SECTION USING THE CLIENT COMPONENT */}
              <div className="flex-shrink-0">
                <CompanyLogo logoUrl={job.logo_url} companyName={job.company} />
              </div>

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
          <p className="text-slate-500 font-medium italic">Aucune offre trouvée.</p>
        </div>
      )}
    </div>
  );
}

export default function Index({ searchParams }: { searchParams: any }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">T</div>
              <span className="text-xl font-black text-slate-900 tracking-tight">Talent<span className="text-blue-600">Maroc</span></span>
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <a href="/" className="hover:text-blue-600 transition-colors">Emplois</a>
              <a href="/employers" className="hover:text-blue-600 transition-colors">Recruteurs</a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="/auth/login" className="hidden sm:block text-sm font-bold text-slate-600">Connexion</a>
            <a href="/employers" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
              <PlusCircle size={16} />
              Publier
            </a>
          </div>
        </div>
      </nav>

      <header className="bg-white border-b border-slate-200 pt-12 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black mb-3 leading-tight">Le job de vos rêves vous attend au Maroc.</h1>
            <p className="text-slate-500">Des milliers d'opportunités actualisées en temps réel.</p>
          </div>
          <form action="/" method="GET" className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-200 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 py-3 gap-3 border-b md:border-b-0 md:border-r border-slate-100">
              <Search size={20} className="text-slate-400" />
              <input name="q" type="text" placeholder="Poste, entreprise..." className="w-full outline-none font-medium" />
            </div>
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <MapPin size={20} className="text-slate-400" />
              <input name="l" type="text" placeholder="Ville (ex: Tanger)" className="w-full outline-none font-medium" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all">
              Rechercher
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-10">
        <aside className="w-full md:w-56 space-y-8">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Villes</h3>
            <div className="flex flex-wrap md:flex-col gap-2 md:gap-3">
              {['Casablanca', 'Tanger', 'Rabat', 'Marrakech', 'Agadir'].map(city => (
                <a key={city} href={`/?l=${city}`} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                  {city}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <h2 className="text-xl font-bold mb-6">Dernières Offres</h2>
          <Suspense fallback={<div className="h-32 w-full bg-white rounded-xl border border-slate-100 animate-pulse" />}>
            <JobList searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}