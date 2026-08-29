import { NextResponse } from 'next/server';
import { isLocalMode } from '../../../../lib/supabase';
import { createRequestClient } from '../../../../lib/supabaseServer';
import { createAdminClient } from '../../../../lib/supabaseAdmin';

export async function POST(req) {
  try {
    // ── Verify the caller's identity via their JWT ──────────────────────
    const authHeader = req.headers.get('authorization') || '';
    const supabase = createRequestClient(authHeader);

    let userId = null;

    if (isLocalMode) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
      }
      userId = session.user.id;
    } else {
      if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
      }
      userId = user.id;
    }

    if (isLocalMode) {
      // In local mode, remove from local storage client
      await supabase.from('blocks').delete().eq('profile_id', userId);
      await supabase.from('reports').delete().eq('reported_profile_id', userId);
      await supabase.from('analytics_events').delete().eq('profile_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.signOut();
      return NextResponse.json({ success: true, message: 'Local account deleted.' });
    }

    // In production, use the service-role admin client for cascading deletes (bypasses RLS)
    // and for deleting the auth user record itself.
    const adminClient = createAdminClient();

    // Cascade delete blocks, reports, analytics, profile
    await adminClient.from('blocks').delete().eq('profile_id', userId);
    await adminClient.from('reports').delete().eq('reported_profile_id', userId);
    await adminClient.from('analytics_events').delete().eq('profile_id', userId);
    await adminClient.from('profiles').delete().eq('id', userId);

    // ── Actually delete the auth user credentials ────────────────────────
    // Without this, the login survives forever even though the profile is gone,
    // breaking the "delete my account" promise made in the Privacy Policy.
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('Failed to delete auth user:', deleteAuthError);
      // Data is already purged — log error
    }

    // Sign out session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: 'Account and all associated data permanently deleted.' });
  } catch (err) {
    console.error('Account deletion error:', err);
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
  }
}
