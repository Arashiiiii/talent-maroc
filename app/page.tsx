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
  // Check variables inside the function to satisfy the build worker
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return <p className="p-4 bg-amber-50 text-amber-700 rounded">Configuration en attente...</p>;
  }

  try {
    const supabase = await createClient();
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (
      <div className="grid gap-6">
        {jobs?.map((job: Job) => (
          <div key={job.original_url} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-orange-500 transition-all">
            <h2 className="text-2xl font-bold text-slate-800">{job.title}</h2>
            <p className="text-slate-600 mb-4">{job.company} — {job.city}</p>
            <a href={job.original_url} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-medium">
              Postuler maintenant
            </a>
          </div>
        ))}
        {(!jobs || jobs.length === 0) && (
          <p className="text-slate-500 italic">Aucune offre trouvée pour le moment.</p>
        )}
      </div>
    );
  } catch (err: any) {
    return <p className="text-red-500">Erreur: {err.message}</p>;
  }
}

export default function Index() {
  return (
    <main className="max-w-4xl mx-auto p-10">
      <h1 className="text-4xl font-black mb-10 text-slate-900">Talent Maroc</h1>
      <Suspense fallback={<p className="text-slate-400">Chargement des offres...</p>}>
        <JobList />
      </Suspense>
    </main>
  );
}