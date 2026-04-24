import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
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

    const { applicationId, status } = await req.json();
    if (!applicationId || !status) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Verify the application belongs to one of this employer's jobs
    const { data: app } = await adminSb
      .from('applications')
      .select('id, job_id')
      .eq('id', applicationId)
      .single();

    if (!app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 });

    const { data: job } = await adminSb
      .from('jobs')
      .select('id')
      .eq('id', app.job_id)
      .eq('employer_id', user.id)
      .single();

    if (!job) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    const { error } = await adminSb
      .from('applications')
      .update({ status })
      .eq('id', applicationId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
