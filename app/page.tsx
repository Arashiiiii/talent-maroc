import { createClient } from '@supabase/supabase-js'; // Use the direct tool
import { Suspense } from 'react';

async function JobList() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-700 font-bold">⚠️ Error: Environment Variables Missing</p>
        <p className="text-sm text-red-600">Vercel is not passing the keys to the server function.</p>
      </div>
    );
  }

  // We create the client manually here to avoid the starter kit's hidden checks
  const supabase = createClient(url, key);

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <p className="text-red-500">Database Error: {error.message}</p>;

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