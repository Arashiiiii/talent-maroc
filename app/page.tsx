export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

export default async function Index() {
  const supabase = await createClient();
  const { data: jobs } = await supabase.from('jobs').select('*');

  return (
    <div className="flex flex-col items-center p-10">
      <h1 className="text-5xl font-black mb-10">Talent Maroc</h1>
      <div className="w-full max-w-3xl">
        {jobs?.map((job: any) => (
          <div key={job.id} className="p-6 border rounded-xl mb-4 bg-white shadow-sm">
            <h2 className="text-2xl font-bold text-orange-600">{job.title}</h2>
            <p className="text-gray-700 font-semibold">{job.company} — {job.city}</p>
          </div>
        ))}
        {(!jobs || jobs.length === 0) && (
          <p className="text-center text-gray-500 italic">No jobs found in the database yet.</p>
        )}
      </div>
    </div>
  );
}