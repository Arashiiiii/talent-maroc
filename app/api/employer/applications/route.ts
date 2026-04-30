import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── GET /api/employer/applications ────────────────────────────────────────────
// Returns all applications for the authenticated employer's jobs.
// Uses service role key (SUPABASE_SERVICE_ROLE_KEY) to bypass candidate-scoped
// RLS on the applications table.
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate the requesting user from Bearer token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 503 });
    }

    // Use admin client to verify the JWT — works with any Supabase key format
    const adminSb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
    const { data: { user }, error: authErr } = await adminSb.auth.getUser(token);
    if (!user || authErr) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 3. Fetch this employer's jobs
    const { data: jobs, error: jobsErr } = await adminSb
      .from('jobs')
      .select('id, title, company')
      .eq('employer_id', user.id);

    if (jobsErr) throw jobsErr;
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    // 4. Fetch applications for those jobs (bypassing RLS via service role)
    const jobIds = jobs.map((j: any) => j.id);
    const { data: applications, error: appsErr } = await adminSb
      .from('applications')
      .select('*')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    if (appsErr) throw appsErr;

    return NextResponse.json({ applications: applications || [] });
  } catch (err: any) {
    // Suppress prerender interruption noise — this route requires request headers
    if (err?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw err;
    console.error('employer/applications GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
