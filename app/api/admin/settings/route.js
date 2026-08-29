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

  try {
    const [
      { data: flags },
      { data: settings },
      { data: reserved },
    ] = await Promise.all([
      supabase.from('feature_flags').select('*').order('name'),
      supabase.from('platform_settings').select('*').order('key'),
      supabase.from('reserved_usernames').select('*').order('username'),
    ]);

    return NextResponse.json({
      success: true,
      flags: flags || [],
      settings: settings || [],
      reserved_usernames: reserved || [],
    });
  } catch (err) {
    console.error('Error fetching admin settings:', err);
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
    const { action, flagName, enabled, settingKey, settingValue, username, reason } = body;

    // 1. Toggle feature flag
    if (action === 'toggle_flag') {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({ enabled: Boolean(enabled) })
        .eq('name', flagName)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction({
        adminId: adminCheck.user?.id,
        adminEmail: adminCheck.user?.email,
        action: 'toggle_feature_flag',
        targetType: 'flag',
        targetId: flagName,
        metadata: { enabled: Boolean(enabled) },
      });

      return NextResponse.json({ success: true, flag: data });
    }

    // 2. Update platform setting
    if (action === 'update_setting') {
      const { data, error } = await supabase
        .from('platform_settings')
        .upsert({ key: settingKey, value: settingValue })
        .select()
        .single();

      if (error) throw error;

      await logAdminAction({
        adminId: adminCheck.user?.id,
        adminEmail: adminCheck.user?.email,
        action: 'update_platform_setting',
        targetType: 'setting',
        targetId: settingKey,
        metadata: { value: settingValue },
      });

      return NextResponse.json({ success: true, setting: data });
    }

    // 3. Add reserved username
    if (action === 'add_reserved_username') {
      const cleanUsername = username?.toLowerCase().trim().replace(/^@/, '');
      if (!cleanUsername) {
        return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('reserved_usernames')
        .insert({
          username: cleanUsername,
          reason: reason?.trim() || 'Reserved by administrator',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await logAdminAction({
        adminId: adminCheck.user?.id,
        adminEmail: adminCheck.user?.email,
        action: 'add_reserved_username',
        targetType: 'username',
        targetId: cleanUsername,
        metadata: { reason },
      });

      return NextResponse.json({ success: true, reserved: data });
    }

    // 4. Remove reserved username
    if (action === 'remove_reserved_username') {
      const cleanUsername = username?.toLowerCase().trim();
      const { error } = await supabase
        .from('reserved_usernames')
        .delete()
        .eq('username', cleanUsername);

      if (error) throw error;

      await logAdminAction({
        adminId: adminCheck.user?.id,
        adminEmail: adminCheck.user?.email,
        action: 'remove_reserved_username',
        targetType: 'username',
        targetId: cleanUsername,
      });

      return NextResponse.json({ success: true, message: 'Reserved username removed.' });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    console.error('Error updating admin settings:', err);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
