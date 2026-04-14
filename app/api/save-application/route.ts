import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── Helper: get user from either cookie session OR Authorization header ────
// The browser Supabase client stores session in localStorage and sends it
// via the Authorization: Bearer <token> header. The server SSR client uses
// cookies. We support both to handle all cases.
async function getUserFromRequest(req: NextRequest) {
  // 1. Try Authorization header first (browser client with localStorage session)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (user && !error) return { user, sb };
  }

  // 2. Try cookie-based session (SSR client)
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

  return { user: null, sb: null };
}

// ── POST /api/save-application ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { user, sb } = await getUserFromRequest(req);
    if (!user || !sb) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { job_id, job_title, company, city, original_url, logo_url, status = 'applied', notes, cv_version } = body;

    if (!job_title || !company) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Check if application already exists for this user+job
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
      // Update existing
      ({ data, error } = await sb
        .from('applications')
        .update({ status, notes, cv_version, updated_at: new Date().toISOString() })
        .eq('id', existingId)
        .select()
        .single());
    } else {
      // Insert new
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
        .select()
        .single());
    }

    if (error) throw error;
    return NextResponse.json({ application: data });
  } catch (err: any) {
    console.error('save-application error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH /api/save-application ────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { user, sb } = await getUserFromRequest(req);
    if (!user || !sb) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

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
    const { user, sb } = await getUserFromRequest(req);
    if (!user || !sb) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { id } = await req.json();
    const { error } = await sb.from('applications').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}