import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabaseAdmin';
import { verifyAdminUser, logAdminAction } from '../../../../lib/adminAuth';

export async function GET(req) {
  const adminCheck = await verifyAdminUser(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';

  try {
    const [{ data: reports }, { data: profiles }, { data: blocks }] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, username, display_name, avatar_url, account_status, is_verified'),
      supabase.from('blocks').select('id, profile_id, type, data, is_disabled'),
    ]);

    let list = (reports || []).map((rep) => {
      const reportedProfile = (profiles || []).find((p) => p.id === rep.reported_profile_id) || null;
      const reportedBlock = (blocks || []).find((b) => b.id === rep.reported_block_id) || null;
      return {
        ...rep,
        reported_profile: reportedProfile,
        reported_block: reportedBlock,
      };
    });

    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      list = list.filter((r) => r.priority === priorityFilter);
    }

    return NextResponse.json({ success: true, reports: list });
  } catch (err) {
    console.error('Error fetching admin reports:', err);
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
    const { reportId, status, resolutionNote, action } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required.' }, { status: 400 });
    }

    // Fetch report
    const { data: report } = await supabase.from('reports').select('*').eq('id', reportId).single();
    if (!report) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }

    // Optional side effects if requested
    if (action === 'disable_reported_block' && report.reported_block_id) {
      await supabase
        .from('blocks')
        .update({ is_disabled: true, moderation_reason: `Disabled via Report #${reportId}: ${report.reason}` })
        .eq('id', report.reported_block_id);

      await logAdminAction({
        adminId: adminCheck.user?.id,
        adminEmail: adminCheck.user?.email,
        action: 'disable_reported_block',
        targetType: 'block',
        targetId: report.reported_block_id,
        metadata: { reportId, reason: report.reason },
      });
    }

    if (action === 'suspend_reported_user' && report.reported_profile_id) {
      await supabase
        .from('profiles')
        .update({
          account_status: 'suspended',
          suspension_reason: `Suspended via Report #${reportId}: ${report.reason}`,
        })
        .eq('id', report.reported_profile_id);

      await logAdminAction({
        adminId: adminCheck.user?.id,
        adminEmail: adminCheck.user?.email,
        action: 'suspend_reported_user',
        targetType: 'user',
        targetId: report.reported_profile_id,
        metadata: { reportId, reason: report.reason },
      });
    }

    // Update report record
    const updates = {
      status: status || 'resolved',
      resolution_note: resolutionNote || '',
      resolved_at: new Date().toISOString(),
      resolved_by: adminCheck.user?.id || null,
    };

    const { data: updatedReport, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: adminCheck.user?.id,
      adminEmail: adminCheck.user?.email,
      action: `report_${updates.status}`,
      targetType: 'report',
      targetId: reportId,
      metadata: { status: updates.status, resolutionNote },
    });

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (err) {
    console.error('Error resolving report:', err);
    return NextResponse.json({ error: 'Failed to update report.' }, { status: 500 });
  }
}
