import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

// We force the page to never pre-render during the build phase
export const dynamic = 'force-dynamic';

async function JobList() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If the keys are missing at the moment of execution, 
  // we show this UI instead of letting the app crash.
  if (!url || !key) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-700 font-medium">
          ⚠️ Configuration en cours... Si ce message persiste, rafraîchissez la page.
        </p>
      </div>
    );
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
        {jobs?.map((job: any) => (
          <div key={job.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-orange-500 transition-all">
            <h2 className="text-2xl font-bold text-slate-800">{job.title}</h2>
            <p className="text-slate-600 mb-4">{job.company} — {job.city}</p>
            <a href={job.original_url} target="_blank" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-medium">
              Postuler maintenant
            </a>
          </div>
        ))}
      </div>
    );
  } catch (e: any) {
    return <p className="text-red-500">Erreur de base de données: {e.message}</p>;
  }
}

export default function Index() {
  return (
    <main className="max-w-4xl mx-auto p-10">
      <h1 className="text-4xl font-black mb-10 text-slate-900">Talent Maroc</h1>
      <Suspense fallback={<p>Chargement...</p>}>
        <JobList />
      </Suspense>
    </main>
  );
}