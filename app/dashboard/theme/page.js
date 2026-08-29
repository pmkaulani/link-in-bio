'use client';
import { useState } from 'react';
import { useDashboard } from '../DashboardContext';
import {
  THEME_PRESETS,
  FONT_OPTIONS,
  GRADIENT_PRESETS,
  SOLID_PALETTE,
  BUTTON_STYLES,
  BUTTON_SHAPES,
  BG_EFFECT_CATEGORIES,
  ENTRANCE_ANIMATIONS,
  HOVER_EFFECTS,
  MOTION_PREFERENCES,
} from '../../../lib/presets';
import { Sparkles, Palette, Type, Layers, Film, Check } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

export default function ThemePage() {
  const { profile, updateProfile, blocks, updateBlock, loading } = useDashboard();
  const [activeTab, setActiveTab] = useState('themes'); // 'themes' | 'typography' | 'buttons' | 'background' | 'animations'

  if (loading || !profile) {
    return (
      <div className="space-y-6 animate-pulse text-black">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-zinc-200" />
          <div className="h-3 w-64 rounded bg-zinc-100" />
        </div>
        <div className="h-10 w-full rounded-2xl bg-zinc-200" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-200 border border-zinc-300 p-3.5 flex flex-col justify-between" />
          ))}
        </div>
      </div>
    );
  }

  function applyPreset(preset) {
    const { name, ...themeFields } = preset;
    updateProfile(themeFields);
  }

  const linkBlocks = blocks.filter((b) => b.type === 'link');

  function applyAnimationToAll(field, value) {
    linkBlocks.forEach((b) => updateBlock(b.id, { [field]: value }));
  }

  function mostCommon(field, fallback) {
    if (linkBlocks.length === 0) return fallback;
    const counts = {};
    linkBlocks.forEach((b) => {
      const v = b.data?.[field] || fallback;
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  const currentAnimation = mostCommon('animation', 'slideUp');
  const currentHover = mostCommon('hover_effect', 'lift');
  const activePreset =
    THEME_PRESETS.find(
      (p) =>
        p.background_value === profile.background_value &&
        p.bg_effect === (profile.bg_effect || 'none') &&
        p.button_style === (profile.button_style || 'fill')
    )?.name ||
    THEME_PRESETS.find((p) => p.background_value === profile.background_value)?.name;
  const radius = profile.button_radius ?? 24;
  const currentButtonStyle = profile.button_style || 'fill';

  const TABS = [
    { id: 'themes', label: 'Themes', icon: Sparkles },
    { id: 'typography', label: 'Fonts', icon: Type },
    { id: 'buttons', label: 'Buttons', icon: Layers },
    { id: 'background', label: 'Background', icon: Palette },
    { id: 'animations', label: 'Motion & Hover', icon: Film },
  ];

  return (
    <div className="space-y-6 pb-20 text-black">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-black">Appearance & Canvas</h1>
        <p className="mt-1 text-xs text-zinc-500">Pick any theme, color gradient, or motion effect for your live profile.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-[8px] bg-zinc-100 p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-[8px] px-4 py-2 text-xs font-bold transition-all ${
                active
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-white/60 hover:text-black'
              }`}
            >
              <Icon size={14} className={active ? 'text-white' : 'text-zinc-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRESET THEMES */}
      {activeTab === 'themes' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Preset Themes (13)</h2>
            <span className="text-xs text-zinc-400">Click to apply full look</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEME_PRESETS.map((preset) => {
              const active = activePreset === preset.name;
              const isLight = preset.text_color === '#111827' || preset.background_value === '#FFFFFF' || preset.background_value === '#FEF08A';
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`group relative flex h-24 flex-col justify-between rounded-[14px] p-3.5 text-left border border-zinc-200 transition-all hover:-translate-y-0.5 hover:shadow-pop ${
                    isLight ? 'border-zinc-200' : ''
                  } ${active ? 'ring-2 ring-black ring-offset-2' : ''}`}
                  style={{ background: preset.background_value, color: preset.text_color || '#FFFFFF' }}
                >
                  <div>
                    <span className="block text-sm font-bold tracking-tight">{preset.name}</span>
                    <span className="block text-[10px] opacity-75">{preset.button_style} · {preset.background_type}</span>
                  </div>
                  {/* Mini button preview mockup */}
                  <div className="flex items-center gap-1.5 opacity-90">
                    <div
                      className="h-3 w-14 rounded-full border border-current/20 bg-current/10"
                      style={{ borderRadius: `${Math.min(preset.button_radius, 12)}px` }}
                    />
                    <div
                      className="h-3 w-8 rounded-full border border-current/20 bg-current/10"
                      style={{ borderRadius: `${Math.min(preset.button_radius, 12)}px` }}
                    />
                  </div>
                  {active && (
                    <span
                      className={`absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-[4px] text-[10px] font-bold ${
                        isLight ? 'bg-black text-white' : 'bg-white/30 text-white backdrop-blur'
                      }`}
                    >
                      <Check size={11} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: TYPOGRAPHY */}
      {activeTab === 'typography' && (
        <section className="space-y-4 py-6 border-t border-zinc-200">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Font Family (12 Fonts)</h2>
            <p className="mt-1 text-xs text-zinc-400">Changes the typography across your entire link page.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {FONT_OPTIONS.map((font) => {
              const active = (profile.font_family || 'inter') === font.value;
              return (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => updateProfile({ font_family: font.value })}
                  className={`group flex flex-col justify-between rounded-[8px] border p-4 text-left transition-all ${
                    active
                      ? 'border-black bg-zinc-50 ring-2 ring-black/10 shadow-sm'
                      : 'border-zinc-200 bg-white hover:border-zinc-400'
                  }`}
                  style={{ fontFamily: font.css }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-black">Aa Bb 123</span>
                    {active && <Check size={14} className="text-black" />}
                  </div>
                  <div className="mt-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <span className="block text-xs font-bold text-black">{font.label}</span>
                    <span className="block text-[11px] text-zinc-400">{font.category}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: BUTTON STYLES */}
      {activeTab === 'buttons' && (
        <div className="space-y-6">
          <section className="space-y-4 py-6 border-t border-zinc-200">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Button Style</h2>
              <p className="mt-1 text-xs text-zinc-400">Choose the fill, border, or glassmorphism effect for all link cards.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BUTTON_STYLES.map((style) => {
                const active = currentButtonStyle === style.value;
                return (
                  <button
                    key={style.value}
                    onClick={() => updateProfile({ button_style: style.value })}
                    className={`flex flex-col rounded-[8px] border p-4 text-left transition-all ${
                      active
                        ? 'border-black bg-zinc-50 ring-2 ring-black/10 shadow-sm'
                        : 'border-zinc-200 bg-white hover:border-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">{style.label}</span>
                      {active && <Check size={14} className="text-black" />}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">{style.description}</p>
                    <div className="mt-3 flex items-center justify-center rounded-[4px] bg-zinc-100 p-2.5">
                      <div
                        className={`h-7 w-full max-w-[140px] rounded-lg transition-all ${
                          style.value === 'outline'
                            ? 'border-2 border-black bg-transparent'
                            : style.value === 'glass'
                              ? 'border border-white/60 bg-black/15 backdrop-blur shadow-sm'
                              : style.value === 'hard_shadow'
                                ? 'border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-black shadow-sm'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4 py-6 border-t border-zinc-200">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Button Roundness</h2>
              <p className="mt-1 text-xs text-zinc-400">Adjust corner radius from sharp modern box to full pill.</p>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {BUTTON_SHAPES.map((shape) => {
                const active = radius === shape.radius;
                return (
                  <button
                    key={shape.radius}
                    onClick={() => updateProfile({ button_radius: shape.radius })}
                    className={`flex flex-col items-center gap-2 rounded-[8px] border p-3 transition ${
                      active
                        ? 'border-black bg-zinc-50 ring-2 ring-black/10 font-bold text-black'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-600'
                    }`}
                  >
                    <div
                      className="h-6 w-10 border-2 border-current bg-current/10"
                      style={{ borderRadius: `${shape.radius / 2.5}px` }}
                    />
                    <span className="text-xs">{shape.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Exact radius <span className="ml-1 font-medium text-zinc-400">{radius}px</span>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={radius}
                  onChange={(e) => updateProfile({ button_radius: Number(e.target.value) })}
                  className="brand-range mt-2 w-full"
                  style={{ '--range-fill': `${(radius / 40) * 100}%` }}
                />
              </label>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: BACKGROUND & EFFECTS */}
      {activeTab === 'background' && (
        <div className="space-y-6">
          <section className="space-y-5 py-6 border-t border-zinc-200">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Background Style</h2>
              <p className="mt-1 text-xs text-zinc-400">Pick a gradient, solid color, or custom wallpaper.</p>
            </div>

            <div className="flex gap-2 rounded-[8px] bg-zinc-100 p-1">
              {[
                { id: 'gradient', label: 'Gradient' },
                { id: 'solid', label: 'Solid Color' },
                { id: 'image', label: 'Wallpaper URL' },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => updateProfile({ background_type: type.id })}
                  className={`flex-1 rounded-[8px] py-2 text-xs font-bold transition ${
                    (profile.background_type || 'gradient') === type.id
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {profile.background_type === 'gradient' && (
              <div className="space-y-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Gradient Palettes</span>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                  {GRADIENT_PRESETS.map((grad) => {
                    const isLight = grad.value.includes('#D8F3DC') || grad.value.includes('#FFE5D9') || grad.value.includes('#F3E8FF') || grad.value.includes('#EDE0D4') || grad.value.includes('#FEF08A') || grad.value.includes('#FEE140');
                    return (
                      <button
                        key={grad.label}
                        onClick={() => updateProfile({ background_value: grad.value, text_color: isLight ? '#111827' : '#FFFFFF' })}
                        className="group relative h-14 rounded-[8px] shadow-sm transition hover:scale-105"
                        style={{ background: grad.value }}
                        title={grad.label}
                      >
                        <span className={`absolute inset-x-0 bottom-1 truncate px-1.5 text-center text-[10px] font-semibold ${isLight ? 'text-black' : 'text-white'} drop-shadow-sm`}>
                          {grad.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {profile.background_type === 'solid' && (
              <div className="space-y-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Quick Palette</span>
                <div className="flex flex-wrap gap-2.5">
                  {SOLID_PALETTE.map((color) => {
                    const isLight = color === '#FFFFFF' || color === '#F4F4F5' || color === '#E4E4E7' || color === '#F0FDF4' || color === '#EFF6FF' || color === '#FAF5FF' || color === '#FEFCE8' || color === '#FFF7ED' || color === '#FDF2F8';
                    const active = (profile.background_value || '').toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        onClick={() => updateProfile({ background_value: color, text_color: isLight ? '#111827' : '#FFFFFF' })}
                        className={`h-9 w-9 rounded-full border shadow-sm transition hover:scale-110 flex items-center justify-center ${
                          active ? 'ring-2 ring-black ring-offset-2 border-black' : 'border-zinc-300'
                        }`}
                        style={{ background: color }}
                      >
                        {active && <Check size={12} className={isLight ? 'text-black' : 'text-white'} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {profile.background_type === 'image' && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Image URL
                  <input
                    type="url"
                    value={profile.background_value || ''}
                    onChange={(e) => updateProfile({ background_value: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="mt-1.5 w-full rounded-[8px] border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                  />
                </label>
              </div>
            )}
          </section>

          {/* Categorized Background Atmosphere */}
          <section className="space-y-6 py-6 border-t border-zinc-200">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-black" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Visual Atmosphere Effects</h2>
              </div>
              <p className="mt-1 text-xs text-zinc-400">Categorized from subtle ambient glow to experimental visual motion.</p>
            </div>

            {BG_EFFECT_CATEGORIES.map((cat) => (
              <div key={cat.category} className="space-y-2.5">
                <div>
                  <h3 className="text-xs font-bold text-black">{cat.category}</h3>
                  <p className="text-[11px] text-zinc-400">{cat.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {cat.effects.map((fx) => {
                    const active = (profile.bg_effect || 'none') === fx.value;
                    return (
                      <button
                        key={fx.value}
                        onClick={() => updateProfile({ bg_effect: fx.value })}
                        className={`flex flex-col items-start rounded-[8px] border p-3 text-left transition ${
                          active
                            ? 'border-black bg-zinc-50 ring-2 ring-black/10 font-bold text-black'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xs font-bold text-black">{fx.label}</span>
                          {active && <Check size={13} className="text-black" />}
                        </div>
                        <span className="mt-1 text-[11px] text-zinc-400">{fx.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* TAB 5: MOTION & HOVER ANIMATIONS */}
      {activeTab === 'animations' && (
        <div className="space-y-6">
          <section className="space-y-5 py-6 border-t border-zinc-200">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Bulk Link Animations</h2>
              <p className="mt-1 text-xs text-zinc-400">Applies entrance and interactive hover effects across all links.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Entrance Animation
                <div className="mt-2">
                  <CustomSelect
                    value={currentAnimation}
                    onChange={(val) => applyAnimationToAll('animation', val)}
                    options={ENTRANCE_ANIMATIONS}
                  />
                </div>
              </label>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Hover Interaction
                <div className="mt-2">
                  <CustomSelect
                    value={currentHover}
                    onChange={(val) => applyAnimationToAll('hover_effect', val)}
                    options={HOVER_EFFECTS}
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Accessibility & Motion Intensity */}
          <section className="space-y-4 py-6 border-t border-zinc-200">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Motion & Accessibility Settings</h2>
              <p className="mt-1 text-xs text-zinc-400">Allow visitors with motion sensitivity to experience a smooth static layout.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MOTION_PREFERENCES.map((mp) => {
                const active = (profile.motion_preference || 'auto') === mp.value;
                return (
                  <button
                    key={mp.value}
                    onClick={() => updateProfile({ motion_preference: mp.value })}
                    className={`flex flex-col items-start rounded-[8px] border p-3.5 text-left transition ${
                      active
                        ? 'border-black bg-zinc-50 ring-2 ring-black/10 font-bold text-black'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-black">{mp.label}</span>
                      {active && <Check size={13} className="text-black" />}
                    </div>
                    <span className="mt-1 text-[11px] text-zinc-400">{mp.desc}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
