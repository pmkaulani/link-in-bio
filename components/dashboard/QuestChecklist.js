'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, ChevronUp, Sparkles, Trophy, ArrowRight, X } from 'lucide-react';
import { getQuestStatus, questProgress } from '../../lib/quests';
import { getQuestFlags } from '../../lib/questFlags';
import ConfettiBurst from './ConfettiBurst';

export default function QuestChecklist({ profile, blocks, hasUnpostedChanges }) {
  const [flags, setFlags] = useState(() => getQuestFlags());
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('quests_collapsed') === 'true';
      } catch (_) {}
    }
    return false;
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrated, setCelebrated] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('quests_celebrated') === 'true';
      } catch (_) {}
    }
    return false;
  });

  const syncFlags = useCallback(() => {
    setFlags(getQuestFlags());
  }, []);

  useEffect(() => {
    syncFlags();
    const handleFlagUpdate = () => syncFlags();
    window.addEventListener('quest-flag-set', handleFlagUpdate);
    window.addEventListener('storage', handleFlagUpdate);
    return () => {
      window.removeEventListener('quest-flag-set', handleFlagUpdate);
      window.removeEventListener('storage', handleFlagUpdate);
    };
  }, [syncFlags]);

  const quests = getQuestStatus({ profile, blocks, flags, hasUnpostedChanges });
  const { completed, total, pct } = questProgress(quests);

  useEffect(() => {
    if (pct === 100 && !celebrated) {
      setShowConfetti(true);
      setCelebrated(true);
      try {
        localStorage.setItem('quests_celebrated', 'true');
      } catch (_) {}
    }
  }, [pct, celebrated]);

  function toggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('quests_collapsed', String(next));
      } catch (_) {}
      return next;
    });
  }

  // If completed 100% and user dismissed/collapsed, render a compact completion badge
  if (pct === 100 && isCollapsed) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-zinc-300 bg-zinc-50/70 px-4 py-3 text-xs text-black shadow-xs animate-profile-in">
        <div className="flex items-center gap-2 font-bold">
          <Trophy size={16} className="text-black" />
          <span>All onboarding quests complete! (6/6)</span>
        </div>
        <button
          onClick={toggleCollapse}
          className="font-bold text-zinc-700 hover:text-black underline"
        >
          View checklist
        </button>
      </div>
    );
  }

  return (
    <>
      {showConfetti && <ConfettiBurst onComplete={() => setShowConfetti(false)} />}
      
      <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-all animate-profile-in text-black">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white shadow-2xs">
              <Sparkles size={14} className={pct === 100 ? 'text-amber-300' : 'text-white'} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  Getting Started Quests
                </h3>
                <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-800">
                  {completed}/{total}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium hidden sm:block">
                Complete these 6 steps to make your link-in-bio page stand out.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-extrabold text-black">{pct}%</span>
            <button
              onClick={toggleCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 hover:text-black"
              title={isCollapsed ? 'Expand quests' : 'Collapse quests'}
              aria-label={isCollapsed ? 'Expand quests' : 'Collapse quests'}
            >
              {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          </div>
        </div>

        {/* Progress bar line */}
        <div className="h-1 w-full bg-zinc-100">
          <div
            className="h-full transition-all duration-500 bg-black"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Quest List */}
        {!isCollapsed && (
          <div className="divide-y divide-zinc-100 p-2 sm:p-3 space-y-1">
            {quests.map((quest) => (
              <Link
                key={quest.id}
                href={quest.href}
                className={`group flex items-center justify-between gap-3 rounded-xl p-2.5 transition sm:px-3.5 ${
                  quest.done
                    ? 'bg-zinc-50/50 text-zinc-400 hover:bg-zinc-50'
                    : 'bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                      quest.done
                        ? 'border-black bg-black text-white'
                        : 'border-zinc-300 bg-white group-hover:border-black'
                    }`}
                  >
                    {quest.done && <Check size={11} strokeWidth={3} />}
                  </div>

                  <div className="min-w-0">
                    <h4
                      className={`text-xs font-bold leading-tight ${
                        quest.done ? 'line-through text-zinc-400 font-medium' : 'text-black'
                      }`}
                    >
                      {quest.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 truncate hidden sm:block">
                      {quest.description}
                    </p>
                  </div>
                </div>

                {!quest.done && (
                  <span className="flex items-center gap-1 text-[11px] font-extrabold text-black opacity-0 transition group-hover:opacity-100 shrink-0">
                    <span>Do it</span>
                    <ArrowRight size={12} />
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
