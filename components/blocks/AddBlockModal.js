'use client';
import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowLeft,
  Sparkles,
  Link as LinkIcon,
  Type,
  AlignLeft,
  Megaphone,
  Image as ImageIcon,
  Video,
  LayoutGrid,
  Minus,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import {
  PLATFORMS,
  POPULAR_PLATFORMS,
  OTHER_PLATFORMS,
  detectPlatformFromUrl,
} from '../../lib/platformGuide';
import SocialIcon from '../ui/SocialIcon';
import GuidedLinkInput from './GuidedLinkInput';

const CONTENT_BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: Type, description: 'Section title to organize your page', defaultData: { text: '' } },
  { type: 'text', label: 'Paragraph / Note', icon: AlignLeft, description: 'Bio note, quote, or description', defaultData: { text: '' } },
  { type: 'callout', label: 'Announcement', icon: Megaphone, description: 'High-visibility notice or special alert', defaultData: { text: '', style: 'highlight' } },
  { type: 'image', label: 'Photo / Banner', icon: ImageIcon, description: 'Single image, banner, or promotional graphic', defaultData: { image_url: '', alt_text: '' } },
  { type: 'video', label: 'Video Embed', icon: Video, description: 'YouTube, Vimeo, or video stream embed', defaultData: { url: '' } },
  { type: 'grid', label: 'Post Grid', icon: LayoutGrid, description: 'Instagram-style 2-column or 3-column photo grid', defaultData: { items: [] } },
  { type: 'divider', label: 'Divider Line', icon: Minus, description: 'Thin separator or dotted rule', defaultData: { style: 'solid' } },
  { type: 'spacer', label: 'Empty Space', icon: ArrowUpDown, description: 'Adjustable blank vertical space', defaultData: { height: 24 } },
];

export default function AddBlockModal({ isOpen, onClose, onAdd }) {
  const [step, setStep] = useState('pick'); // 'pick' | 'configure'
  const [selectedType, setSelectedType] = useState('link');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [activeTab, setActiveTab] = useState('popular'); // 'popular' | 'more' | 'content'

  // Smart Paste input
  const [pasteInput, setPasteInput] = useState('');
  const [pasteDetection, setPasteDetection] = useState(null);

  // Link draft data
  const [linkDraft, setLinkDraft] = useState({
    title: '',
    subtitle: '',
    url: '',
    icon: 'instagram',
    platform: 'instagram',
  });

  // Non-link content draft data
  const [contentDraft, setContentDraft] = useState({});

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('pick');
      setActiveTab('popular');
      setPasteInput('');
      setPasteDetection(null);
      setSelectedPlatform('instagram');
      const cfg = PLATFORMS.instagram;
      setLinkDraft({
        title: cfg.defaultTitle(''),
        subtitle: cfg.defaultSubtitle,
        url: '',
        icon: 'instagram',
        platform: 'instagram',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Smart Paste from the top search bar
  function handlePasteInput(val) {
    setPasteInput(val);
    if (!val.trim()) {
      setPasteDetection(null);
      return;
    }

    const detected = detectPlatformFromUrl(val.trim());
    if (detected) {
      setPasteDetection(detected);
    } else {
      setPasteDetection(null);
    }
  }

  function applyPastedLink(detected) {
    setSelectedType('link');
    setSelectedPlatform(detected.platformKey);
    setLinkDraft({
      title: detected.title,
      subtitle: detected.subtitle,
      url: detected.cleanUrl,
      icon: detected.icon,
      platform: detected.platformKey,
    });
    setStep('configure');
  }

  // Choose a platform to configure
  function handleSelectPlatform(platKey) {
    const cfg = PLATFORMS[platKey] || PLATFORMS.link;
    setSelectedType('link');
    setSelectedPlatform(platKey);
    setLinkDraft({
      title: cfg.defaultTitle(''),
      subtitle: cfg.defaultSubtitle || '',
      url: '',
      icon: cfg.icon || platKey,
      platform: platKey,
    });
    setStep('configure');
  }

  // Choose a non-link content block
  function handleSelectContentBlock(blockMeta) {
    setSelectedType(blockMeta.type);
    setContentDraft(blockMeta.defaultData || {});
    setStep('configure');
  }

  // Final confirmation to add block to page
  function handleConfirmAdd() {
    if (selectedType === 'link') {
      const cfg = PLATFORMS[selectedPlatform] || PLATFORMS.link;
      const finalTitle = linkDraft.title.trim() || cfg.defaultTitle('') || 'Explore Link';
      const finalUrl = linkDraft.url.trim() || 'https://';

      onAdd('link', {
        title: finalTitle,
        subtitle: linkDraft.subtitle.trim(),
        url: finalUrl,
        icon: linkDraft.icon || selectedPlatform,
        platform: selectedPlatform,
        animation: 'slideUp',
        hover_effect: 'lift',
      });
    } else {
      onAdd(selectedType, contentDraft);
    }
    onClose();
  }

  const currentPlatConfig = PLATFORMS[selectedPlatform] || PLATFORMS.link;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md animate-profile-in">
      <div className="relative w-full max-w-lg rounded-[28px] bg-white p-5 sm:p-7 shadow-2xl border border-zinc-200 text-black max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          {step === 'configure' ? (
            <button
              onClick={() => setStep('pick')}
              className="flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-black transition"
            >
              <ArrowLeft size={15} />
              <span>Back to choices</span>
            </button>
          ) : (
            <div>
              <h3 className="text-base font-black text-black">Add to your page</h3>
              <p className="text-xs text-zinc-400">Choose what you want to share with your audience</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-black transition"
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* STEP 1: PICK WHAT TO ADD */}
          {step === 'pick' && (
            <div className="space-y-4">
              {/* Smart Paste Bar */}
              <div className="rounded-2xl bg-zinc-50 border border-zinc-200/90 p-3.5 space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Quick Add: Paste any link
                </label>
                <div className="relative flex items-center">
                  <Search size={14} className="absolute left-3 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={pasteInput}
                    onChange={(e) => handlePasteInput(e.target.value)}
                    placeholder="Paste full URL (e.g. instagram.com/you or spotify.com/...)"
                    className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none"
                  />
                </div>

                {pasteDetection && (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-emerald-600 shrink-0" />
                      <span>
                        Detected <strong>{PLATFORMS[pasteDetection.platformKey]?.label || pasteDetection.platformKey}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => applyPastedLink(pasteDetection)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                    >
                      Use this link →
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/70 text-xs">
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`flex-1 rounded-lg py-1.5 font-bold transition ${
                    activeTab === 'popular' ? 'bg-white text-black shadow-xs' : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  Popular Links
                </button>
                <button
                  onClick={() => setActiveTab('more')}
                  className={`flex-1 rounded-lg py-1.5 font-bold transition ${
                    activeTab === 'more' ? 'bg-white text-black shadow-xs' : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  More Apps
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`flex-1 rounded-lg py-1.5 font-bold transition ${
                    activeTab === 'content' ? 'bg-white text-black shadow-xs' : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  Blocks & Layout
                </button>
              </div>

              {/* Tab 1: Popular Platforms */}
              {activeTab === 'popular' && (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {POPULAR_PLATFORMS.map((platKey) => {
                    const cfg = PLATFORMS[platKey];
                    if (!cfg) return null;
                    return (
                      <button
                        key={platKey}
                        onClick={() => handleSelectPlatform(platKey)}
                        className="group flex flex-col items-start gap-1 rounded-2xl border border-zinc-200 bg-white p-3 text-left transition hover:border-black hover:shadow-md active:scale-95"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 group-hover:scale-105 transition-transform">
                          <SocialIcon name={cfg.icon} className="text-[18px]" />
                        </div>
                        <span className="text-xs font-black text-black mt-1">{cfg.label}</span>
                        <span className="text-[10px] text-zinc-400 leading-tight truncate w-full">{cfg.example ? `e.g. ${cfg.example}` : 'Link card'}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: More Apps */}
              {activeTab === 'more' && (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {OTHER_PLATFORMS.map((platKey) => {
                    const cfg = PLATFORMS[platKey];
                    if (!cfg) return null;
                    return (
                      <button
                        key={platKey}
                        onClick={() => handleSelectPlatform(platKey)}
                        className="group flex flex-col items-start gap-1 rounded-2xl border border-zinc-200 bg-white p-3 text-left transition hover:border-black hover:shadow-md active:scale-95"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 group-hover:scale-105 transition-transform">
                          <SocialIcon name={cfg.icon} className="text-[16px]" />
                        </div>
                        <span className="text-xs font-bold text-black mt-1">{cfg.label}</span>
                        <span className="text-[10px] text-zinc-400 leading-tight truncate w-full">{cfg.defaultSubtitle}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tab 3: Content & Layout Blocks */}
              {activeTab === 'content' && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CONTENT_BLOCK_TYPES.map((blockMeta) => {
                    const Icon = blockMeta.icon;
                    return (
                      <button
                        key={blockMeta.type}
                        onClick={() => handleSelectContentBlock(blockMeta)}
                        className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 text-left transition hover:border-black hover:shadow-md active:scale-95"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white group-hover:scale-105 transition-transform">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-black">{blockMeta.label}</span>
                          <span className="block text-[10px] text-zinc-500 leading-tight mt-0.5">{blockMeta.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CONFIGURE THE SELECTED BLOCK/LINK */}
          {step === 'configure' && (
            <div className="space-y-4">
              {/* Selected Type Title Banner */}
              <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-xs">
                  {selectedType === 'link' ? (
                    <SocialIcon name={currentPlatConfig.icon} className="text-[20px]" />
                  ) : (
                    <LinkIcon size={18} className="text-black" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black text-black">
                    {selectedType === 'link' ? `Add ${currentPlatConfig.label} Link` : `Add ${selectedType}`}
                  </h4>
                  <p className="text-[11px] text-zinc-500">{currentPlatConfig.defaultSubtitle || 'Configure details below'}</p>
                </div>
              </div>

              {/* Guided Platform Input */}
              {selectedType === 'link' ? (
                <div className="space-y-3.5">
                  <GuidedLinkInput
                    platform={selectedPlatform}
                    url={linkDraft.url}
                    onChange={(patch) => setLinkDraft((prev) => ({ ...prev, ...patch }))}
                    onPlatformChange={(newPlat) => setSelectedPlatform(newPlat)}
                    showContextualTip={true}
                  />

                  {/* Title / What visitors will see */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Link Title (What visitors will see)
                    </label>
                    <input
                      type="text"
                      value={linkDraft.title}
                      onChange={(e) => setLinkDraft((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder={currentPlatConfig.defaultTitle('')}
                      className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
                    />
                  </div>

                  {/* Live Mini Card Preview */}
                  <div className="pt-2 border-t border-zinc-100">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Preview of this card
                    </label>
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-900 p-3 text-white flex items-center justify-between shadow-md">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                          <SocialIcon name={linkDraft.icon || currentPlatConfig.icon} className="text-[16px]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-white">
                            {linkDraft.title || currentPlatConfig.defaultTitle('') || 'Explore Link'}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {linkDraft.subtitle || currentPlatConfig.defaultSubtitle || 'Click to visit'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-zinc-500 shrink-0">→</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Generic Content Block Inputs */
                <div className="space-y-3">
                  {selectedType === 'heading' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Section Heading</label>
                      <input
                        type="text"
                        value={contentDraft.text || ''}
                        onChange={(e) => setContentDraft({ ...contentDraft, text: e.target.value })}
                        placeholder="e.g. Featured Projects or My Playlists"
                        className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedType === 'text' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Paragraph / Bio Note</label>
                      <textarea
                        value={contentDraft.text || ''}
                        onChange={(e) => setContentDraft({ ...contentDraft, text: e.target.value })}
                        rows={3}
                        placeholder="Write a brief note to your visitors..."
                        className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedType === 'callout' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Announcement Message</label>
                      <input
                        type="text"
                        value={contentDraft.text || ''}
                        onChange={(e) => setContentDraft({ ...contentDraft, text: e.target.value })}
                        placeholder="e.g. New album out this Friday!"
                        className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedType === 'image' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Image URL</label>
                      <input
                        type="url"
                        value={contentDraft.image_url || ''}
                        onChange={(e) => setContentDraft({ ...contentDraft, image_url: e.target.value })}
                        placeholder="https://images.example.com/banner.jpg"
                        className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedType === 'video' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Video Embed URL</label>
                      <input
                        type="url"
                        value={contentDraft.url || ''}
                        onChange={(e) => setContentDraft({ ...contentDraft, url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=... or vimeo.com/..."
                        className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        {step === 'configure' && (
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep('pick')}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-black transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAdd}
              className="flex-1 rounded-xl bg-black py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              <span>Add to page</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
