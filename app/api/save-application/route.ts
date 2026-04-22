import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function createAuthClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
}

async function getUserFromRequest(req: NextRequest): Promise<{ user: any; sb: any } | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const sb = createAuthClient(token);
    const { data: { user }, error } = await sb.auth.getUser();
    if (user && !error) return { user, sb };
  }

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
    const {
      job_id, job_title, company, city, original_url, logo_url,
      status = 'applied', notes, cv_version, cover_letter,
      // Form can override candidate info (e.g. user edited name before applying)
      candidate_name:  name_override,
      candidate_email: email_override,
    } = body;

    if (!job_title || !company) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Prefer body overrides, fall back to user metadata / auth email
    const candidate_email = email_override || user.email || null;
    const candidate_name  = name_override  || user.user_metadata?.name || null;
    const cv_url          = user.user_metadata?.cv_url || null;

    // Check for existing application
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
        .update({ status, notes, cv_version, cover_letter, cv_url, updated_at: new Date().toISOString() })
        .eq('id', existingId)
        .select().single());
    } else {
      ({ data, error } = await sb
        .from('applications')
        .insert({
          user_id:         user.id,
          job_id:          job_id || null,
          job_title,
          company,
          city,
          original_url,
          logo_url,
          status,
          notes,
          cv_version,
          cover_letter:    cover_letter || null,
          candidate_email,
          candidate_name,
          cv_url,
          applied_at:      new Date().toISOString(),
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

    const { id, status, notes, cv_version, cover_letter } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status !== undefined)       updates.status       = status;
    if (notes !== undefined)        updates.notes        = notes;
    if (cv_version !== undefined)   updates.cv_version   = cv_version;
    if (cover_letter !== undefined) updates.cover_letter = cover_letter;
    if (status === 'applied')       updates.applied_at   = new Date().toISOString();

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
