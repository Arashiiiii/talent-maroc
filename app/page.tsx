import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

// This function will run on the server every time a user visits
async function JobList() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Manual fallback check
  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="p-10 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700">
        <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
        <p>The server is unable to detect your Supabase API keys.</p>
        <p className="mt-4 text-sm font-mono bg-white p-2 border">
          URL: {supabaseUrl ? 'Found' : 'MISSING'} <br />
          Key: {supabaseKey ? 'Found' : 'MISSING'}
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500">Database Error: {error.message}</p>;
  }

  return (
    <div className="grid gap-6">
      {data?.map((job: any) => (
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
      <h1 className="text-4xl font-black mb-10">Talent Maroc</h1>
      <Suspense fallback={<p className="text-slate-400">Initialisation...</p>}>
        <JobList />
      </Suspense>
    </main>
  );
}