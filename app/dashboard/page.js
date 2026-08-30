'use client';
import { useState } from 'react';
import { useDashboard } from './DashboardContext';
import BlockList from '../../components/blocks/BlockList';
import QuestChecklist from '../../components/dashboard/QuestChecklist';
import { setQuestFlag } from '../../lib/questFlags';
import { Send, CheckCircle2, ExternalLink } from 'lucide-react';

export default function BlocksPage() {
  const {
    profile,
    blocks,
    hasUnpostedChanges,
    publishChanges,
    loading,
    addBlock,
    updateBlock,
    deleteBlock,
    toggleBlockVisibility,
    reorderBlocks,
  } = useDashboard();

  const [posting, setPosting] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);

  async function handlePost() {
    setPosting(true);
    await publishChanges();
    setQuestFlag('published');
    setTimeout(() => {
      setPosting(false);
      setPostedSuccess(true);
      setTimeout(() => setPostedSuccess(false), 5000);
    }, 400);
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-black">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-28 rounded-lg bg-zinc-200" />
            <div className="h-3 w-40 rounded bg-zinc-100" />
          </div>
          <div className="h-9 w-24 rounded-full bg-zinc-200" />
        </div>
        <div className="h-12 w-full rounded-[4px] bg-zinc-200 border border-zinc-300" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full rounded-[4px] border border-zinc-200 bg-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[4px] bg-zinc-100" />
                <div className="space-y-2">
                  <div className="h-4 w-44 rounded bg-zinc-200" />
                  <div className="h-2.5 w-24 rounded bg-zinc-100" />
                </div>
              </div>
              <div className="h-5 w-5 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleCount = blocks.filter((b) => b.is_visible !== false).length;

  return (
    <div className="text-black">
      {/* Onboarding Quest Checklist */}
      <QuestChecklist
        profile={profile}
        blocks={blocks}
        hasUnpostedChanges={hasUnpostedChanges}
      />

      {/* Header bar with Post button */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-black">Links</h1>
            {hasUnpostedChanges ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-300 px-2.5 py-0.5 text-[11px] font-bold text-zinc-800">
                <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
                Draft changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-[11px] font-bold text-zinc-800">
                <CheckCircle2 size={12} className="text-black" />
                All changes live
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Preview updates live on your right. Changes stay in draft until you click <strong>Post changes</strong>.
          </p>
        </div>

        {/* Post Button — ONLY shown when there are draft changes to post */}
        {(hasUnpostedChanges || posting || postedSuccess) && (
          <button
            onClick={handlePost}
            disabled={posting}
            className="flex shrink-0 items-center justify-center gap-2 rounded-[6px] bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 disabled:opacity-60 animate-profile-in"
            title="Publish your draft changes live"
          >
            {posting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Posting...
              </>
            ) : postedSuccess ? (
              <>
                <CheckCircle2 size={15} />
                Posted Live!
              </>
            ) : (
              <>
                <Send size={14} />
                Post changes
              </>
            )}
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {postedSuccess && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-[4px] border border-zinc-200 bg-zinc-100 px-4 py-3 text-xs font-semibold text-black animate-profile-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-black shrink-0" />
            <span>Your changes are posted live! ({visibleCount} {visibleCount === 1 ? 'link' : 'links'} active)</span>
          </div>
          {profile?.username && (
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-black underline"
            >
              View live <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

      <BlockList
        blocks={blocks}
        onAdd={addBlock}
        onUpdate={updateBlock}
        onDelete={deleteBlock}
        onToggleVisibility={toggleBlockVisibility}
        onReorder={reorderBlocks}
      />
    </div>
  );
}
