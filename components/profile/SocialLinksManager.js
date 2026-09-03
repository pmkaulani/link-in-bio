'use client';
import { useState, useMemo, useEffect } from 'react';
import {
  PLATFORMS,
  cleanUsername,
} from '../../lib/platformGuide';
import {
  normalizeSocialAccounts,
  syncSocialsWithAccounts,
  formatAccountDisplay,
} from '../../lib/socialAccounts';
import SocialIcon from '../ui/SocialIcon';
import SocialAccountModal from './SocialAccountModal';
import {
  Plus,
  Trash2,
  ExternalLink,
  Edit2,
  Star,
  Share2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function SocialLinksManager({ profile, updateProfile, isLinksPage = false }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(isLinksPage);

  // Normalize accounts from profile.social_accounts or profile.socials
  const accounts = useMemo(() => {
    return normalizeSocialAccounts(profile);
  }, [profile?.social_accounts, profile?.socials]);

  const [localAccounts, setLocalAccounts] = useState(accounts);
  useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);

  const isGlobalVisible = profile?.socials?._visible !== false;

  function handleToggleGlobalVisibility() {
    const next = !isGlobalVisible;
    const current = profile?.socials || {};
    updateProfile({
      socials: {
        ...current,
        _visible: next,
      },
    });
  }

  function handleToggleAccountVisibility(accountId) {
    const updated = localAccounts.map((a) => {
      if (a.id === accountId) {
        return { ...a, is_visible: a.is_visible === false ? true : false };
      }
      return a;
    });

    setLocalAccounts(updated);

    const syncedSocials = syncSocialsWithAccounts(updated, profile?.socials || {});
    updateProfile({
      socials: syncedSocials,
    });
  }

  function handleSaveAccount(accountData) {
    let updated = [];
    const exists = localAccounts.some((a) => a.id === accountData.id);

    if (exists) {
      updated = localAccounts.map((a) => (a.id === accountData.id ? accountData : a));
    } else {
      updated = [...localAccounts, accountData];
    }

    // Ensure only one primary account per platform
    if (accountData.is_primary) {
      updated = updated.map((a) => {
        if (a.platform === accountData.platform && a.id !== accountData.id) {
          return { ...a, is_primary: false };
        }
        return a;
      });
    }

    setLocalAccounts(updated);

    const syncedSocials = syncSocialsWithAccounts(updated, profile?.socials || {});
    updateProfile({
      socials: syncedSocials,
    });
    setAccountToEdit(null);
  }

  function handleDeleteAccount(accountId) {
    const target = localAccounts.find((a) => a.id === accountId);
    let updated = localAccounts.filter((a) => a.id !== accountId);

    // If deleted account was primary and others exist for same platform, promote the first one
    if (target?.is_primary) {
      const samePlatformIndex = updated.findIndex((a) => a.platform === target.platform);
      if (samePlatformIndex >= 0) {
        updated[samePlatformIndex] = { ...updated[samePlatformIndex], is_primary: true };
      }
    }

    setLocalAccounts(updated);

    const syncedSocials = syncSocialsWithAccounts(updated, profile?.socials || {});
    updateProfile({
      socials: syncedSocials,
    });
  }

  function handleSetPrimary(accountId) {
    const target = localAccounts.find((a) => a.id === accountId);
    if (!target) return;

    const updated = localAccounts.map((a) => {
      if (a.platform === target.platform) {
        return { ...a, is_primary: a.id === accountId };
      }
      return a;
    });

    setLocalAccounts(updated);

    const syncedSocials = syncSocialsWithAccounts(updated, profile?.socials || {});
    updateProfile({
      socials: syncedSocials,
    });
  }

  function openEditModal(account) {
    setAccountToEdit(account);
    setModalOpen(true);
  }

  function openAddModal() {
    setAccountToEdit(null);
    setModalOpen(true);
  }

  return (
    <div className="py-5 border-t border-zinc-200">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Social Accounts</h2>
            <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
              {localAccounts.length} {localAccounts.length === 1 ? 'account' : 'accounts'}
            </span>
            {!isGlobalVisible && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <EyeOff size={10} />
                Hidden on profile
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            Connect your personal, business, or creator profiles across any platform.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Global Visibility Toggle Button */}
          <button
            type="button"
            onClick={handleToggleGlobalVisibility}
            className={`flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
              isGlobalVisible
                ? 'border-zinc-200 bg-white text-zinc-700 hover:border-black hover:text-black'
                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
            title={isGlobalVisible ? 'Hide all social icons from public profile' : 'Show social icons on public profile'}
          >
            {isGlobalVisible ? <Eye size={13} className="text-zinc-500" /> : <EyeOff size={13} className="text-amber-700" />}
            <span>{isGlobalVisible ? 'Visible on profile' : 'Hidden on profile'}</span>
          </button>

          {/* Add Account Button */}
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 rounded-[8px] bg-black px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 active:scale-95"
          >
            <Plus size={13} />
            <span>Add social account</span>
          </button>

          {/* Collapse/Expand Toggle on Links Page */}
          {isLinksPage && (
            <button
              type="button"
              onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-black transition"
              title={isSectionCollapsed ? 'Expand social accounts' : 'Collapse social accounts'}
            >
              {isSectionCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Collapsed State on Links Page */}
      {isLinksPage && isSectionCollapsed ? (
        <div
          onClick={() => setIsSectionCollapsed(false)}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-xs text-zinc-600 hover:border-black hover:bg-white transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-black">{localAccounts.length} accounts configured</span>
            <span className="text-[11px] text-zinc-400">
              • {isGlobalVisible ? 'Visible on profile' : 'Hidden on profile'}
            </span>
          </div>
          <span className="text-xs font-bold text-black underline">Expand accounts</span>
        </div>
      ) : (
        /* Accounts Collection List */
        localAccounts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {localAccounts.map((acc) => {
              const pCfg = PLATFORMS[acc.platform] || { label: acc.platform, icon: acc.platform };
              const samePlatformCount = localAccounts.filter((a) => a.platform === acc.platform).length;
              const isAccVisible = acc.is_visible !== false;

              return (
                <div
                  key={acc.id}
                  className={`group flex flex-col justify-between gap-3 rounded-2xl border bg-white p-3.5 shadow-xs hover:border-zinc-300 transition animate-profile-in ${
                    isAccVisible ? 'border-zinc-200' : 'border-zinc-200/60 bg-zinc-50/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-black border border-zinc-200/80 shadow-xs">
                        <SocialIcon name={pCfg.icon || acc.platform} className="text-[16px]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-black">{pCfg.label}</span>
                          {acc.label && (
                            <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.2 text-[9px] font-bold text-zinc-700">
                              {acc.label}
                            </span>
                          )}
                          {acc.is_primary && samePlatformCount > 1 && (
                            <span className="flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">
                              <Star size={9} className="fill-amber-500 text-amber-500" />
                              Primary
                            </span>
                          )}
                          {!isAccVisible && (
                            <span className="flex items-center gap-0.5 rounded-full bg-zinc-100 border border-zinc-300 px-1.5 py-0.2 text-[9px] font-bold text-zinc-500">
                              <EyeOff size={9} />
                              Hidden
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] font-medium text-zinc-500 truncate mt-0.5">
                          {formatAccountDisplay(acc)}
                        </span>
                      </div>
                    </div>

                    {/* Top Action Icons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Individual Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleAccountVisibility(acc.id)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                          isAccVisible
                            ? 'text-zinc-400 hover:bg-zinc-100 hover:text-black'
                            : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                        }`}
                        title={isAccVisible ? 'Hide this account on public profile' : 'Show this account on public profile'}
                      >
                        {isAccVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>

                      {acc.url && (
                        <a
                          href={acc.url.startsWith('http') || acc.url.startsWith('mailto:') || acc.url.startsWith('tel:') ? acc.url : `https://${acc.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
                          title="Open link in new tab"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditModal(acc)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
                        title="Edit account"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete account"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Bar: Link & Primary Toggle */}
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[10px] text-zinc-400">
                    <span className="font-mono truncate max-w-[200px]">
                      {acc.url}
                    </span>

                    {samePlatformCount > 1 && !acc.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(acc.id)}
                        className="flex items-center gap-1 font-semibold text-zinc-500 hover:text-black transition"
                        title="Set as primary account for this platform"
                      >
                        <Star size={11} />
                        <span>Make Primary</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-xs mb-2.5 text-zinc-400">
              <Share2 size={18} />
            </div>
            <h3 className="text-xs font-bold text-black">No social accounts added yet</h3>
            <p className="mt-1 max-w-xs text-xs text-zinc-400">
              Connect your personal, business, or creator profiles on Instagram, TikTok, YouTube, WhatsApp, and more.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-3.5 flex items-center gap-1.5 rounded-[8px] bg-black px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 active:scale-95"
            >
              <Plus size={13} />
              <span>Add your first social account</span>
            </button>
          </div>
        )
      )}

      {/* Account Modal */}
      <SocialAccountModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setAccountToEdit(null);
        }}
        accountToEdit={accountToEdit}
        existingAccounts={localAccounts}
        onSave={handleSaveAccount}
      />
    </div>
  );
}
