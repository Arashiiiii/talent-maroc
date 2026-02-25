import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  description: string;
  original_url: string;
}

async function JobList() {
  const supabase = await createClient();
  
  // We fetch the data and check for a specific database error
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <h2 className="text-red-800 font-bold">Database Error</h2>
        <p className="text-red-600 text-sm">{error.message}</p>
        <p className="mt-2 text-xs text-red-400 italic">Hint: If it says 'relation jobs does not exist', check your table name in Supabase.</p>
      </div>
    );
  }

  const jobs = data as Job[];

  return (
    <div className="grid gap-6">
      {jobs && jobs.length > 0 ? (
        jobs.map((job: Job) => (
          <div key={job.original_url} className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-orange-500 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                {job.title}
              </h2>
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">{job.city}</span>
            </div>
            <p className="text-lg font-medium text-slate-600 mb-4">{job.company}</p>
            <a 
              href={job.original_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-orange-600 transition-colors"
            >
              Postuler maintenant
            </a>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium italic">Aucun job trouvé dans la base de données.</p>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-10 border-b pb-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Talent Maroc</h1>
        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold uppercase">Live</span>
      </div>

      <Suspense fallback={<p className="text-center text-slate-400 animate-pulse">Connexion à la base de données...</p>}>
        <JobList />
      </Suspense>
    </main>
  );
}