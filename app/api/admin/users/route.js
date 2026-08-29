import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabaseAdmin';
import { verifyAdminUser, logAdminAction } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const adminCheck = await verifyAdminUser(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const statusFilter = searchParams.get('status') || 'all';

  try {
    const [{ data: profiles }, { data: blocks }, { data: reports }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('blocks').select('id, profile_id, type, is_visible, is_disabled'),
      supabase.from('reports').select('id, reported_profile_id, status'),
    ]);

    let list = (profiles || []).map((p) => {
      const userBlocks = (blocks || []).filter((b) => b.profile_id === p.id);
      const userReports = (reports || []).filter((r) => r.reported_profile_id === p.id);
      return {
        ...p,
        blocks_count: userBlocks.length,
        disabled_blocks_count: userBlocks.filter((b) => b.is_disabled).length,
        reports_count: userReports.length,
        pending_reports_count: userReports.filter((r) => r.status === 'pending').length,
      };
    });

    if (q) {
      list = list.filter((p) =>
        (p.username && p.username.toLowerCase().includes(q)) ||
        (p.display_name && p.display_name.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.bio && p.bio.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'verified') {
        list = list.filter((p) => p.is_verified);
      } else if (statusFilter === 'suspended') {
        list = list.filter((p) => p.account_status === 'suspended' || p.account_status === 'banned');
      } else if (statusFilter === 'warning') {
        list = list.filter((p) => p.account_status === 'warning');
      } else if (statusFilter === 'active') {
        list = list.filter((p) => (p.account_status || 'active') === 'active');
      }
    }

    return NextResponse.json({ success: true, users: list });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req) {
  const adminCheck = await verifyAdminUser(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const supabase = createAdminClient();

  try {
    const body = await req.json();
    const { action, userId, status, reason, is_verified } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // 1. Update status (active, warning, suspended, banned)
    if (action === 'update_status') {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          account_status: status,
          suspension_reason: reason || null,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction({
        adminId: adminCheck.user?.id,
        adminEmail: adminCheck.user?.email,
        action: `set_status_${status}`,
        targetType: 'user',
        targetId: userId,
        metadata: { status, reason, username: data?.username },
      });

      return NextResponse.json({ success: true, user: data });
    }

    // 2. Toggle verification
    if (action === 'toggle_verified') {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_verified: Boolean(is_verified) })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction({
        adminId: adminCheck.user?.id,
        adminEmail: adminCheck.user?.email,
        action: is_verified ? 'verify_user' : 'unverify_user',
        targetType: 'user',
        targetId: userId,
        metadata: { is_verified: Boolean(is_verified), username: data?.username },
      });

      return NextResponse.json({ success: true, user: data });
    }

    // 3. Delete user
    if (action === 'delete_user') {
      await supabase.from('blocks').delete().eq('profile_id', userId);
      await supabase.from('reports').delete().eq('reported_profile_id', userId);
      await supabase.from('analytics_events').delete().eq('profile_id', userId);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);

      if (error) throw error;

      // Delete auth credentials if in production mode
      if (supabase.auth?.admin?.deleteUser) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (e) {
          console.error('Error deleting auth user:', e);
        }
      }

      await logAdminAction({
        adminId: adminCheck.user?.id,
        adminEmail: adminCheck.user?.email,
        action: 'delete_user_account',
        targetType: 'user',
        targetId: userId,
        metadata: { reason },
      });

      return NextResponse.json({ success: true, message: 'User deleted successfully.' });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    console.error('Error modifying user in admin:', err);
    return NextResponse.json({ error: 'Failed to perform user action.' }, { status: 500 });
  }
}
