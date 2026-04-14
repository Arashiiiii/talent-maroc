import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── Create an authenticated Supabase client from the Bearer JWT ────────────
// We create the client with the user's access token so all queries
// run with auth.uid() set correctly — satisfying RLS policies.
function createAuthClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );
}

async function getUserFromRequest(req: NextRequest): Promise<{ user: any; sb: any } | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    // Create client with the token injected — this sets auth.uid() in RLS
    const sb = createAuthClient(token);
    const { data: { user }, error } = await sb.auth.getUser();
    if (user && !error) return { user, sb };
  }

  // Fallback: cookie-based session (SSR)
  try {
    const { createServerClient } = await import('@supabase/ssr');
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await sb.auth.getUser();
    if (user) return { user, sb };
  } catch { /* ignore */ }

  return null;
}

// ── POST /api/save-application ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const { user, sb } = auth;

    const body = await req.json();
    const { job_id, job_title, company, city, original_url, logo_url,
            status = 'applied', notes, cv_version } = body;

    if (!job_title || !company) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Check for existing application for this user + job
    let existingId: string | null = null;
    if (job_id) {
      const { data: existing } = await sb
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', job_id)
        .maybeSingle();
      if (existing) existingId = existing.id;
    }

    let data, error;
    if (existingId) {
      ({ data, error } = await sb
        .from('applications')
        .update({ status, notes, cv_version, updated_at: new Date().toISOString() })
        .eq('id', existingId)
        .select().single());
    } else {
      ({ data, error } = await sb
        .from('applications')
        .insert({
          user_id:    user.id,
          job_id:     job_id || null,
          job_title,
          company,
          city,
          original_url,
          logo_url,
          status,
          notes,
          cv_version,
          applied_at: new Date().toISOString(),
        })
        .select().single());
    }

    if (error) throw error;
    return NextResponse.json({ application: data });
  } catch (err: any) {
    console.error('save-application POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH /api/save-application ────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const { user, sb } = auth;

    const { id, status, notes, cv_version } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status !== undefined)     updates.status     = status;
    if (notes !== undefined)      updates.notes      = notes;
    if (cv_version !== undefined) updates.cv_version = cv_version;
    if (status === 'applied')     updates.applied_at = new Date().toISOString();

    const { data, error } = await sb
      .from('applications').update(updates)
      .eq('id', id).eq('user_id', user.id)
      .select().single();

    if (error) throw error;
    return NextResponse.json({ application: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE /api/save-application ───────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const { user, sb } = auth;

    const { id } = await req.json();
    const { error } = await sb
      .from('applications').delete()
      .eq('id', id).eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}