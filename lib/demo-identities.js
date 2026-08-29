/**
 * Centralized Themed Demo Identities & Sample Personas
 * 
 * Replaces generic/developer placeholder names with themed fictional identities
 * tailored to various creative, minimal, cyberpunk, academic, fashion, and adventure vibes.
 */

export const DEMO_IDENTITIES = [
  // ── Editorial / Creative ──
  {
    id: 'amelie',
    name: 'Amelie Poulain',
    username: 'amelie',
    category: 'editorial',
    theme: 'editorial',
    role: 'Photographer * Paris',
    tagline: 'Collector of little moments',
    bio: 'Photographer, filmmaker & collector of little moments. Documenting quiet everyday poetry.',
    avatarText: 'AP',
    avatarUrl: '',
    website: 'https://ameliepoulain.photography',
    links: [
      { title: 'Selected Photography Portfolio', subtitle: 'Paris streets & analog 35mm prints', icon: 'camera' },
      { title: 'Substack: Notebook of Details', subtitle: 'Bi-weekly essays on observations', icon: 'blog' },
      { title: 'Short Film: Le Fabuleux Destin', subtitle: 'Watch the festival cut on Vimeo', icon: 'video' },
      { title: 'Exhibition & Print Inquiries', subtitle: 'Studio visits & collaborations', icon: 'email' },
    ],
    socials: {
      instagram: 'https://instagram.com/amelie.paris',
      youtube: 'https://youtube.com/@amelieart',
      twitter: 'https://twitter.com/ameliepoulain',
    },
  },
  {
    id: 'mia',
    name: 'Mia Dolan',
    username: 'miadolan',
    category: 'editorial',
    theme: 'creative',
    role: 'Filmmaker * Los Angeles',
    tagline: 'Actress & Playwright',
    bio: 'Actress, playwright & coffee enthusiast. Writing one-woman plays and independent cinema.',
    avatarText: 'MD',
    avatarUrl: '',
    website: 'https://miadolan.art',
    links: [
      { title: 'One-Woman Show: So Long Boulder City', subtitle: 'Show dates & theater tickets', icon: 'ticket' },
      { title: 'Actor Spotlight & Showreel', subtitle: 'Dramatic & musical performances', icon: 'video' },
      { title: 'Original Screenplay drafts', subtitle: 'Read excerpts on Substack', icon: 'document' },
    ],
    socials: {
      instagram: 'https://instagram.com/miadolan',
      spotify: 'https://open.spotify.com/artist/miadolan',
    },
  },

  // ── Minimal / Premium ──
  {
    id: 'bond',
    name: 'James Bond',
    username: 'jamesbond',
    category: 'minimal',
    theme: 'minimal',
    role: 'Strategic Consultant * London',
    tagline: 'Advisory & Operations',
    bio: 'Strategic consultant & international operations. High-stakes advisory and risk intelligence.',
    avatarText: 'JB',
    avatarUrl: '',
    website: 'https://universal-exports.co.uk',
    links: [
      { title: 'Executive Advisory Portfolio', subtitle: 'Confidential risk assessment briefing', icon: 'shield' },
      { title: 'Bespoke Horology & Heritage', subtitle: 'Curated British timepieces & tailoring', icon: 'store' },
      { title: 'Private Direct Inquiries', subtitle: 'Encrypted communications only', icon: 'lock' },
    ],
    socials: {
      linkedin: 'https://linkedin.com/in/james-bond-advisory',
      twitter: 'https://twitter.com/jb_consulting',
    },
  },
  {
    id: 'thomascrown',
    name: 'Thomas Crown',
    username: 'thomascrown',
    category: 'minimal',
    theme: 'luxury',
    role: 'Founder * Investor',
    tagline: 'Crown Acquisitions',
    bio: 'Art acquisition, venture capital & private equity. Seeking high-impact founders in fintech & aerospace.',
    avatarText: 'TC',
    avatarUrl: '',
    website: 'https://crownacquisitions.com',
    links: [
      { title: 'Crown Ventures Portfolio', subtitle: 'Active investments across Series A & B', icon: 'briefcase' },
      { title: 'Impressionist Art Collection', subtitle: 'Museum loans & private gallery viewings', icon: 'image' },
      { title: 'Annual Letter to Partners', subtitle: 'Macroeconomics & alternative assets', icon: 'document' },
    ],
    socials: {
      linkedin: 'https://linkedin.com/in/thomascrown',
    },
  },

  // ── Cyberpunk / Futuristic ──
  {
    id: 'trinity',
    name: 'Trinity',
    username: 'trinity',
    category: 'cyberpunk',
    theme: 'cyberpunk',
    role: 'Software Engineer * Systems',
    tagline: 'Distributed Systems & Crypto',
    bio: 'Systems architecture, neural interfaces & cryptography. Decentralizing nodes and building secure protocols.',
    avatarText: 'TR',
    avatarUrl: '',
    website: 'https://matrix-node.network',
    links: [
      { title: 'Zero-Knowledge Kernel Code', subtitle: 'Open-source on GitHub (30k stars)', icon: 'github' },
      { title: 'Terminal Diagnostics Live', subtitle: 'Public network health monitor', icon: 'code' },
      { title: 'Whitepaper: Consensus in Chaos', subtitle: 'Distributed consensus architecture', icon: 'document' },
      { title: 'Encrypted Matrix Channel', subtitle: 'Join 5,000+ protocol engineers', icon: 'discord' },
    ],
    socials: {
      github: 'https://github.com/trinity-core',
      telegram: 'https://t.me/trinity_node',
      twitter: 'https://twitter.com/trinity_matrix',
    },
  },
  {
    id: 'kusanagi',
    name: 'Motoko Kusanagi',
    username: 'kusanagi',
    category: 'cyberpunk',
    theme: 'matrix',
    role: 'Security Architect * Tokyo',
    tagline: 'Section 9 Operations',
    bio: 'Autonomous network operations & cybernetics. Advanced threat intelligence and memory encryption.',
    avatarText: 'MK',
    avatarUrl: '',
    website: 'https://section9.security',
    links: [
      { title: 'Threat Intelligence Dispatch', subtitle: 'Autonomous network anomaly reports', icon: 'shield' },
      { title: 'Neural Encryption Library', subtitle: 'Rust crate for hardware-level crypto', icon: 'github' },
    ],
    socials: {
      github: 'https://github.com/kusanagi-sec',
    },
  },

  // ── Dark / Gothic ──
  {
    id: 'wednesday',
    name: 'Wednesday Addams',
    username: 'wednesday',
    category: 'dark',
    theme: 'dark',
    role: 'Writer * Artist',
    tagline: 'Nevermore Academy',
    bio: 'Writer, cellist & connoisseur of macabre arts. Investigating ancient mysteries with relentless cynicism.',
    avatarText: 'WA',
    avatarUrl: '',
    website: 'https://wednesdayaddams.art',
    links: [
      { title: 'Manuscript: Viper De La Muerte', subtitle: 'Mystery novel chapters & drafts', icon: 'book' },
      { title: 'Cello Covers: Gothic Quartets', subtitle: 'Stream orchestral arrangements', icon: 'music' },
      { title: 'Botanical Poison Garden Tour', subtitle: 'Nightshade & belladonna cultivation', icon: 'sparkles' },
    ],
    socials: {
      spotify: 'https://open.spotify.com/artist/wednesday',
      youtube: 'https://youtube.com/@wednesdaycello',
    },
  },

  // ── Retro / Playful ──
  {
    id: 'marty',
    name: 'Marty McFly',
    username: 'marty',
    category: 'retro',
    theme: 'retro',
    role: 'Musician * Hill Valley',
    tagline: 'The Pinheads & Hoverboards',
    bio: 'Lead guitarist, skateboarder & temporal explorer. Rock and roll from 1955 to 2015.',
    avatarText: 'MM',
    avatarUrl: '',
    website: 'https://pinheads.band',
    links: [
      { title: 'Johnny B. Goode (Live Demo)', subtitle: 'Guitar solo recorded in 1955', icon: 'spotify' },
      { title: 'The Pinheads Debut EP', subtitle: 'Stream high-voltage rock & roll', icon: 'music' },
      { title: 'Hoverboard Skate Clips', subtitle: 'Watch street tricks on YouTube', icon: 'youtube' },
      { title: 'Doc Brown Science Lab Updates', subtitle: 'Flux capacitor schematics & test runs', icon: 'zap' },
    ],
    socials: {
      youtube: 'https://youtube.com/@martymcfly',
      spotify: 'https://open.spotify.com/artist/martymcfly',
      instagram: 'https://instagram.com/marty.mcfly',
    },
  },

  // ── Nature / Lifestyle / Travel ──
  {
    id: 'moana',
    name: 'Moana Waialiki',
    username: 'moana',
    category: 'nature',
    theme: 'organic',
    role: 'Wayfinder * Pacific',
    tagline: 'Ocean Voyaging & Wayfinding',
    bio: 'Wayfinder, ocean voyager & island storyteller. Restoring ecological balance through ancient navigation.',
    avatarText: 'MW',
    avatarUrl: '',
    website: 'https://wayfinding-voyages.org',
    links: [
      { title: 'Celestial Navigation Guide', subtitle: 'Reading the stars, swells and trade winds', icon: 'compass' },
      { title: 'Ocean Conservation Alliance', subtitle: 'Protecting reef habitats & marine sanctuaries', icon: 'globe' },
      { title: 'Island Heritage Oral Histories', subtitle: 'Preserving Polynesian voyaging chants', icon: 'book' },
    ],
    socials: {
      instagram: 'https://instagram.com/wayfinder.moana',
      youtube: 'https://youtube.com/@voyagesofmoana',
    },
  },

  // ── Adventure / Exploration ──
  {
    id: 'lara',
    name: 'Lara Croft',
    username: 'laracroft',
    category: 'adventure',
    theme: 'adventure',
    role: 'Archaeologist * Oxford',
    tagline: 'Expeditions & Heritage',
    bio: 'Archaeology, artifact preservation & expedition director. Discovering forgotten civilisations across 5 continents.',
    avatarText: 'LC',
    avatarUrl: '',
    website: 'https://croft-manor-archives.ac.uk',
    links: [
      { title: 'Expedition Field Journals', subtitle: 'Peru, Egypt, Cambodia & Svalbard research', icon: 'map' },
      { title: 'Artifact Provenance Registry', subtitle: 'Repatriation & academic catalog', icon: 'document' },
      { title: 'Croft Manor Library & Armory', subtitle: 'Historical research collection', icon: 'book' },
    ],
    socials: {
      twitter: 'https://twitter.com/laracroft',
      youtube: 'https://youtube.com/@croftarchaeology',
    },
  },

  // ── Academic / Research ──
  {
    id: 'hermione',
    name: 'Hermione Granger',
    username: 'hermione',
    category: 'academic',
    theme: 'academic',
    role: 'Researcher * London',
    tagline: 'Ethics & Legal Reform',
    bio: 'Archivist, researcher & advocate for equitable rights. Reading every book in the library twice.',
    avatarText: 'HG',
    avatarUrl: '',
    website: 'https://magical-ethics.org',
    links: [
      { title: 'Treatise on Creature Rights', subtitle: 'Comprehensive legislative whitepaper', icon: 'book' },
      { title: 'Advanced Arithmancy Research', subtitle: 'Predictive mathematical modeling', icon: 'code' },
      { title: 'Hogwarts Alumni Mentorship', subtitle: 'Book academic coaching sessions', icon: 'calendar' },
    ],
    socials: {
      linkedin: 'https://linkedin.com/in/hermione-granger',
    },
  },

  // ── Fashion / Beauty / Lifestyle ──
  {
    id: 'cher',
    name: 'Cher Horowitz',
    username: 'cher',
    category: 'fashion',
    theme: 'fashion',
    role: 'Fashion & Lifestyle * Beverly Hills',
    tagline: 'Wardrobe Curator',
    bio: 'Wardrobe curator, debate captain & lifestyle editor. Totally matching yellow plaid since 1995.',
    avatarText: 'CH',
    avatarUrl: '',
    website: 'https://cherhorowitz.style',
    links: [
      { title: 'Digital Closet Algorithm', subtitle: 'Browse curated seasonal outfit matches', icon: 'store' },
      { title: 'Debate Strategy & Makeover Guide', subtitle: 'Download my foolproof makeover manual', icon: 'document' },
      { title: 'Beverly Hills Pismo Beach Relief', subtitle: 'Donate to community charity drives', icon: 'heart' },
    ],
    socials: {
      instagram: 'https://instagram.com/cherhorowitz',
      tiktok: 'https://tiktok.com/@totallycher',
      youtube: 'https://youtube.com/@cherstyle',
    },
  },
];

/**
 * Returns a demo identity by matching ID, category, or theme.
 */
export function getDemoIdentity(key = 'amelie') {
  const match = DEMO_IDENTITIES.find(
    (d) => d.id === key || d.category === key || d.theme === key || d.username === key
  );
  return match || DEMO_IDENTITIES[0];
}

/**
 * Provides context-aware placeholder values for form inputs.
 */
export function getDemoPlaceholders(context = 'general') {
  switch (context) {
    case 'developer':
    case 'systems':
      return { name: 'Trinity', username: 'trinity', bio: 'Systems architecture, neural interfaces & cryptography.' };
    case 'minimal':
    case 'executive':
      return { name: 'James Bond', username: 'jamesbond', bio: 'Strategic consultant & international operations.' };
    case 'creative':
    case 'photographer':
    case 'editorial':
      return { name: 'Amelie Poulain', username: 'amelie', bio: 'Photographer, filmmaker & collector of little moments.' };
    case 'academic':
    case 'student':
      return { name: 'Hermione Granger', username: 'hermione', bio: 'Archivist, researcher & advocate for equitable rights.' };
    case 'fashion':
      return { name: 'Cher Horowitz', username: 'cher', bio: 'Wardrobe curator, debate captain & lifestyle editor.' };
    case 'dark':
    case 'gothic':
      return { name: 'Wednesday Addams', username: 'wednesday', bio: 'Writer, cellist & connoisseur of macabre arts.' };
    case 'retro':
    case 'music':
      return { name: 'Marty McFly', username: 'marty', bio: 'Lead guitarist, skateboarder & temporal explorer.' };
    case 'nature':
    case 'travel':
      return { name: 'Moana Waialiki', username: 'moana', bio: 'Wayfinder, ocean voyager & island storyteller.' };
    default:
      return { name: 'Amelie Poulain', username: 'amelie', bio: 'Photographer, filmmaker & collector of little moments.' };
  }
}

/**
 * Sample Demo Creator Cards for UI galleries and showcases.
 */
export const SAMPLE_CREATOR_CARDS = [
  {
    name: 'Amelie Poulain',
    username: 'amelie',
    role: 'Photographer * Paris',
    bio: 'Photographer, filmmaker & collector of little moments.',
    theme: 'Editorial',
    badge: 'Art & Culture',
    views: '48.2k',
  },
  {
    name: 'Trinity',
    username: 'trinity',
    role: 'Software Engineer * Systems',
    bio: 'Systems architecture, neural interfaces & cryptography.',
    theme: 'Cyberpunk',
    badge: 'Engineering',
    views: '92.4k',
  },
  {
    name: 'James Bond',
    username: 'jamesbond',
    role: 'Strategic Consultant * London',
    bio: 'Strategic consultant & international operations.',
    theme: 'Minimal',
    badge: 'Executive',
    views: '34.8k',
  },
  {
    name: 'Wednesday Addams',
    username: 'wednesday',
    role: 'Writer * Artist',
    bio: 'Writer, cellist & connoisseur of macabre arts.',
    theme: 'Dark Gothic',
    badge: 'Literature',
    views: '61.9k',
  },
  {
    name: 'Marty McFly',
    username: 'marty',
    role: 'Musician * Hill Valley',
    bio: 'Guitarist, skateboarder & temporal explorer.',
    theme: 'Retro Synth',
    badge: 'Music',
    views: '73.1k',
  },
  {
    name: 'Cher Horowitz',
    username: 'cher',
    role: 'Fashion & Lifestyle * Beverly Hills',
    bio: 'Wardrobe curator, debate captain & lifestyle editor.',
    theme: 'Fashion',
    badge: 'Lifestyle',
    views: '88.5k',
  },
];
