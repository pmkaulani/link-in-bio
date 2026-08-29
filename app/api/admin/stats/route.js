import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabaseAdmin';
import { verifyAdminUser } from '../../../../lib/adminAuth';

export async function GET(req) {
  const adminCheck = await verifyAdminUser(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const supabase = createAdminClient();

  try {
    const [
      { data: profiles },
      { data: blocks },
      { data: reports },
      { data: analytics },
      { data: flags },
    ] = await Promise.all([
      supabase.from('profiles').select('id, username, created_at, account_status, is_verified, theme'),
      supabase.from('blocks').select('id, type, is_visible, is_disabled'),
      supabase.from('reports').select('id, status, priority, reason, created_at'),
      supabase.from('analytics_events').select('event_type, referrer, device_type, created_at'),
      supabase.from('feature_flags').select('*'),
    ]);

    const allProfiles = profiles || [];
    const allBlocks = blocks || [];
    const allReports = reports || [];
    const allAnalytics = analytics || [];

    const totalUsers = allProfiles.length;
    const activeUsers = allProfiles.filter((p) => (p.account_status || 'active') === 'active').length;
    const suspendedUsers = allProfiles.filter((p) => p.account_status === 'suspended' || p.account_status === 'banned').length;
    const verifiedUsers = allProfiles.filter((p) => p.is_verified).length;

    const pendingReports = allReports.filter((r) => r.status === 'pending').length;
    const urgentReports = allReports.filter((r) => r.priority === 'urgent' && r.status === 'pending').length;
    const resolvedReports = allReports.filter((r) => r.status === 'resolved').length;

    const totalViews = allAnalytics.filter((e) => e.event_type === 'view').length;
    const totalClicks = allAnalytics.filter((e) => e.event_type === 'click').length;

    // Theme usage distribution
    const themeCounts = {};
    allProfiles.forEach((p) => {
      const t = p.theme || 'growth';
      themeCounts[t] = (themeCounts[t] || 0) + 1;
    });

    // Block type distribution
    const blockTypeCounts = {};
    allBlocks.forEach((b) => {
      const type = b.type || 'link';
      blockTypeCounts[type] = (blockTypeCounts[type] || 0) + 1;
    });

    // Recent users list with block & report metrics
    const recentUsers = allProfiles.slice(0, 6).map((p) => {
      const uBlocks = allBlocks.filter((b) => b.profile_id === p.id).length;
      const uReports = allReports.filter((r) => r.reported_profile_id === p.id).length;
      return {
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        account_status: p.account_status || 'active',
        is_verified: p.is_verified || false,
        created_at: p.created_at,
        blocks_count: uBlocks,
        reports_count: uReports,
      };
    });

    // New users today
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const newUsersToday = allProfiles.filter((p) => p.created_at && p.created_at >= oneDayAgo).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        verifiedUsers,
        newUsersToday,
        publicPages: totalUsers,
        totalBlocks: allBlocks.length,
        disabledBlocks: allBlocks.filter((b) => b.is_disabled).length,
        reports: {
          total: allReports.length,
          pending: pendingReports,
          urgent: urgentReports,
          resolved: resolvedReports,
        },
        analytics: {
          totalViews,
          totalClicks,
          ctr: totalViews > 0 ? Math.round((totalClicks / totalViews) * 1000) / 10 : 0,
        },
        themeCounts,
        blockTypeCounts,
        flags: flags || [],
        recentUsers,
      },
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
