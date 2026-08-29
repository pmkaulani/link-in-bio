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
  const filter = searchParams.get('filter') || 'all'; // 'all', 'disabled', 'flagged'

  try {
    const [{ data: blocks }, { data: profiles }] = await Promise.all([
      supabase.from('blocks').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, username, display_name, account_status'),
    ]);

    let list = (blocks || [])
      .filter((b) => b.type === 'link' || b.data?.url)
      .map((b) => {
        const owner = (profiles || []).find((p) => p.id === b.profile_id) || null;
        const url = b.data?.url || '';
        let domain = '';
        try {
          domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        } catch {
          domain = url;
        }
        return {
          ...b,
          owner,
          domain,
        };
      });

    if (q) {
      list = list.filter((b) =>
        (b.data?.title && b.data.title.toLowerCase().includes(q)) ||
        (b.data?.url && b.data.url.toLowerCase().includes(q)) ||
        (b.domain && b.domain.toLowerCase().includes(q)) ||
        (b.owner?.username && b.owner.username.toLowerCase().includes(q))
      );
    }

    if (filter === 'disabled') {
      list = list.filter((b) => b.is_disabled);
    }

    return NextResponse.json({ success: true, links: list });
  } catch (err) {
    console.error('Error fetching admin links:', err);
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
    const { blockId, is_disabled, reason } = body;

    if (!blockId) {
      return NextResponse.json({ error: 'Block ID is required.' }, { status: 400 });
    }

    const { data: updatedBlock, error } = await supabase
      .from('blocks')
      .update({
        is_disabled: Boolean(is_disabled),
        moderation_reason: is_disabled ? (reason || 'Disabled by Trust & Safety') : null,
      })
      .eq('id', blockId)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: adminCheck.user?.id,
      adminEmail: adminCheck.user?.email,
      action: is_disabled ? 'disable_block' : 'enable_block',
      targetType: 'block',
      targetId: blockId,
      metadata: { is_disabled: Boolean(is_disabled), reason },
    });

    return NextResponse.json({ success: true, block: updatedBlock });
  } catch (err) {
    console.error('Error moderating link block:', err);
    return NextResponse.json({ error: 'Failed to update link block.' }, { status: 500 });
  }
}
