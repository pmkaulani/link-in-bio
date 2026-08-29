export const THEME_PRESETS = [
  { name: 'Classic Monochrome', primary_color: '#000000', text_color: '#111827', background_type: 'solid', background_value: '#FFFFFF', bg_effect: 'none', button_style: 'fill', button_radius: 24 },
  { name: 'Midnight Aurora', primary_color: '#7C3AED', text_color: '#FFFFFF', background_type: 'gradient', background_value: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #7C3AED 100%)', bg_effect: 'aurora', button_style: 'fill', button_radius: 24 },
  { name: 'Studio Dark', primary_color: '#FFFFFF', text_color: '#FFFFFF', background_type: 'solid', background_value: '#09090B', bg_effect: 'none', button_style: 'fill', button_radius: 18 },
  { name: 'Ocean Wave', primary_color: '#0284C7', text_color: '#FFFFFF', background_type: 'gradient', background_value: 'linear-gradient(135deg, #082F49 0%, #0E7490 50%, #164E63 100%)', bg_effect: 'particles', button_style: 'fill', button_radius: 24 },
  { name: 'Carbon Grid', primary_color: '#3B82F6', text_color: '#FFFFFF', background_type: 'solid', background_value: '#0D0F14', bg_effect: 'dot_grid', button_style: 'glass', button_radius: 16 },
  { name: 'Matcha Mist', primary_color: '#2D6A4F', text_color: '#1B4332', background_type: 'gradient', background_value: 'linear-gradient(135deg, #D8F3DC 0%, #B7E4C7 50%, #95D5B2 100%)', bg_effect: 'none', button_style: 'fill', button_radius: 32 },
  { name: 'Lavender Dream', primary_color: '#7209B7', text_color: '#240046', background_type: 'gradient', background_value: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 50%, #D8B4FE 100%)', bg_effect: 'aurora', button_style: 'fill', button_radius: 24 },
  { name: 'Sunset Flare', primary_color: '#F97316', text_color: '#FFFFFF', background_type: 'gradient', background_value: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 45%, #BE123C 100%)', bg_effect: 'aurora', button_style: 'fill', button_radius: 24 },
  { name: 'Cosmic Starfield', primary_color: '#8B5CF6', text_color: '#FFFFFF', background_type: 'gradient', background_value: 'linear-gradient(135deg, #090A1A 0%, #150E38 50%, #2D1260 100%)', bg_effect: 'starfield', button_style: 'glass', button_radius: 20 },
  { name: 'Liquid Chrome', primary_color: '#EC4899', text_color: '#FFFFFF', background_type: 'gradient', background_value: 'linear-gradient(135deg, #0B091A 0%, #1E1035 50%, #14052B 100%)', bg_effect: 'iridescent', button_style: 'glass', button_radius: 24 },
  { name: 'Hyper Laser', primary_color: '#06B6D4', text_color: '#FFFFFF', background_type: 'gradient', background_value: 'linear-gradient(135deg, #030712 0%, #082F49 50%, #0F172A 100%)', bg_effect: 'laser_beams', button_style: 'glass', button_radius: 16 },
  { name: 'Cyber Matrix', primary_color: '#10B981', text_color: '#FFFFFF', background_type: 'solid', background_value: '#050709', bg_effect: 'cyber_grid', button_style: 'outline', button_radius: 12 },
  { name: 'Retro Pop', primary_color: '#000000', text_color: '#111827', background_type: 'solid', background_value: '#FEF08A', bg_effect: 'grid_warp', button_style: 'hard_shadow', button_radius: 8 },
];

export const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter', category: 'Modern Clean', css: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { value: 'poppins', label: 'Poppins', category: 'Geometric & Friendly', css: "'Poppins', sans-serif" },
  { value: 'outfit', label: 'Outfit', category: 'Modern Tech', css: "'Outfit', sans-serif" },
  { value: 'plus_jakarta', label: 'Plus Jakarta', category: 'Startup Crisp', css: "'Plus Jakarta Sans', sans-serif" },
  { value: 'playfair', label: 'Playfair Display', category: 'Luxury Editorial', css: "'Playfair Display', Georgia, serif" },
  { value: 'lora', label: 'Lora', category: 'Literary Elegance', css: "'Lora', serif" },
  { value: 'syne', label: 'Syne', category: 'Bold Creative', css: "'Syne', sans-serif" },
  { value: 'quicksand', label: 'Quicksand', category: 'Soft & Rounded', css: "'Quicksand', sans-serif" },
  { value: 'jetbrains', label: 'JetBrains Mono', category: 'Developer Mono', css: "'JetBrains Mono', monospace" },
  { value: 'montserrat', label: 'Montserrat', category: 'Contemporary Sans', css: "'Montserrat', sans-serif" },
  { value: 'serif', label: 'Classic Serif', category: 'Traditional', css: 'Georgia, Cambria, "Times New Roman", serif' },
  { value: 'mono', label: 'System Mono', category: 'Monospace', css: 'ui-monospace, monospace' },
];

export const GRADIENT_PRESETS = [
  { label: 'Deep Emerald', value: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #15803d 100%)' },
  { label: 'Midnight Indigo', value: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #7C3AED 100%)' },
  { label: 'Cyber Turquoise', value: 'linear-gradient(135deg, #082F49 0%, #0E7490 50%, #164E63 100%)' },
  { label: 'Sunset Blaze', value: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 45%, #BE123C 100%)' },
  { label: 'Electric Purple', value: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)' },
  { label: 'Crimson Wine', value: 'linear-gradient(135deg, #4C0519 0%, #881337 50%, #E11D48 100%)' },
  { label: 'Pastel Matcha', value: 'linear-gradient(135deg, #D8F3DC 0%, #B7E4C7 50%, #95D5B2 100%)' },
  { label: 'Blush Rose', value: 'linear-gradient(135deg, #FFE5D9 0%, #FFCAD4 100%)' },
  { label: 'Lavender Dream', value: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 50%, #D8B4FE 100%)' },
  { label: 'Warm Sand', value: 'linear-gradient(135deg, #EDE0D4 0%, #E6CCB2 50%, #DDB892 100%)' },
  { label: 'Dark Carbon', value: 'linear-gradient(135deg, #09090B 0%, #18181B 50%, #27272A 100%)' },
  { label: 'Golden Sunset', value: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)' },
];

export const SOLID_PALETTE = [
  '#FFFFFF', '#000000', '#09090B', '#18181B',
  '#F4F4F5', '#E4E4E7', '#F0FDF4', '#EFF6FF',
  '#FAF5FF', '#FEFCE8', '#FFF7ED', '#FDF2F8',
];

export const BUTTON_STYLES = [
  { value: 'fill', label: 'Solid Card', description: 'Clean solid card with subtle shadow' },
  { value: 'outline', label: 'Outline Border', description: 'Transparent with sharp colored border' },
  { value: 'glass', label: 'Glassmorphism', description: 'Frosted translucent backdrop with glow' },
  { value: 'hard_shadow', label: 'Retro 3D Shadow', description: 'Bold offset brutalist pop shadow' },
];

export const BUTTON_SHAPES = [
  { radius: 0, label: 'Sharp' },
  { radius: 10, label: 'Subtle' },
  { radius: 20, label: 'Curved' },
  { radius: 36, label: 'Full Pill' },
];

export const ENTRANCE_ANIMATIONS = [
  ['slideUp', 'Slide up'], ['fade', 'Fade'], ['slideLeft', 'Slide left'],
  ['zoom', 'Zoom'], ['blur', 'Blur'], ['bounce', 'Bounce'], ['none', 'None'],
];

// Categorized background visual effects (Clean / Subtle Recommended by default, Experimental optional)
export const BG_EFFECT_CATEGORIES = [
  {
    category: 'Recommended (Clean & Atmospheric)',
    description: 'Clean, elegant, lightweight atmospheric gradients and subtle texture',
    effects: [
      { value: 'none', label: 'None / Pure Clean', desc: 'Clean solid or gradient without effects' },
      { value: 'aurora', label: 'Aurora Waves', desc: 'Soft floating fluid neon glow' },
      { value: 'film_grain', label: 'Tactile Film Grain', desc: 'Analog subtle noise texture' },
      { value: 'particles', label: 'Floating Orbs', desc: 'Gentle ambient floating spheres' },
      { value: 'dot_grid', label: 'Dot Matrix Grid', desc: 'Sleek technical micro-dots' },
    ],
  },
  {
    category: 'Experimental (Special Profile Themes)',
    description: 'High-energy futuristic light beams and holographic flow for custom creator themes',
    effects: [
      { value: 'grid_warp', label: 'Blueprint Mesh', desc: 'Modern geometric architectural grid' },
      { value: 'starfield', label: 'Starfield Dust', desc: 'Twinkling cosmic floating stars' },
      { value: 'laser_beams', label: 'Laser Beams', desc: 'Criss-crossing neon laser flow' },
      { value: 'cyber_grid', label: 'Cyberpunk Matrix', desc: 'Digital grid with animated scanlines' },
      { value: 'hyperspeed', label: 'Hyperspeed Beams', desc: 'Futuristic light streaks' },
      { value: 'iridescent', label: 'Liquid Chrome', desc: 'Flowing iridescent holographic waves' },
    ],
  },
];

export const BG_EFFECTS = BG_EFFECT_CATEGORIES.flatMap((c) => c.effects);

export const HOVER_EFFECTS = [
  ['lift', 'Spring Lift'], ['glow', 'Neon Glow'], ['spotlight', 'Spotlight Card'],
  ['border_beam', 'Border Beam Glow'], ['shine', 'Liquid Shimmer'],
  ['tilt', '3D Magnetic Tilt'], ['scale', 'Pulse Scale'], ['none', 'None'],
];

export const MOTION_PREFERENCES = [
  { value: 'auto', label: 'Automatic', desc: 'Follows visitor device settings' },
  { value: 'normal', label: 'Active Motion', desc: 'Full animations enabled' },
  { value: 'reduced', label: 'Reduced Motion', desc: 'Disables rapid transitions for accessibility' },
];

export const QUICK_SOCIALS = [
  { icon: 'youtube', title: 'YouTube', urlPrefix: 'https://youtube.com/@' },
  { icon: 'spotify', title: 'Spotify', urlPrefix: 'https://open.spotify.com/' },
  { icon: 'instagram', title: 'Instagram', urlPrefix: 'https://instagram.com/' },
  { icon: 'tiktok', title: 'TikTok', urlPrefix: 'https://tiktok.com/@' },
  { icon: 'twitter', title: 'X / Twitter', urlPrefix: 'https://x.com/' },
  { icon: 'store', title: 'Store / Shop', urlPrefix: 'https://' },
  { icon: 'discord', title: 'Discord', urlPrefix: 'https://discord.gg/' },
  { icon: 'github', title: 'GitHub', urlPrefix: 'https://github.com/' },
  { icon: 'twitch', title: 'Twitch', urlPrefix: 'https://twitch.tv/' },
  { icon: 'telegram', title: 'Telegram', urlPrefix: 'https://t.me/' },
  { icon: 'globe', title: 'Website', urlPrefix: 'https://' },
  { icon: 'email', title: 'Email', urlPrefix: 'mailto:' },
];
