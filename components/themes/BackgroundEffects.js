'use client';

export default function BackgroundEffects({ effect = 'aurora', primary = '#7C3AED' }) {
  if (effect === 'none') return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 1. Aurora Waves */}
      {(effect === 'aurora' || !effect) && (
        <>
          <div
            className="absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-40 blur-3xl react-ambient-aura"
            style={{ background: primary }}
          />
          <div
            className="absolute -right-20 top-1/3 h-64 w-64 rounded-full opacity-30 blur-3xl react-ambient-aura"
            style={{ background: '#38BDF8', animationDelay: '-4s' }}
          />
        </>
      )}

      {/* 2. Starfield Dust (Twinkling Cosmic Particles) */}
      {effect === 'starfield' && (
        <div className="absolute inset-0">
          {[
            { top: '10%', left: '20%', size: 'w-1 h-1', delay: '0s', color: 'bg-purple-200' },
            { top: '15%', left: '75%', size: 'w-1.5 h-1.5', delay: '-1s', color: 'bg-white' },
            { top: '35%', left: '15%', size: 'w-1 h-1', delay: '-2.2s', color: 'bg-cyan-200' },
            { top: '42%', left: '85%', size: 'w-2 h-2', delay: '-0.7s', color: 'bg-indigo-300' },
            { top: '60%', left: '30%', size: 'w-1 h-1', delay: '-1.5s', color: 'bg-white' },
            { top: '72%', left: '70%', size: 'w-1.5 h-1.5', delay: '-2.8s', color: 'bg-purple-300' },
            { top: '85%', left: '18%', size: 'w-1 h-1', delay: '-0.4s', color: 'bg-pink-200' },
            { top: '90%', left: '80%', size: 'w-1 h-1', delay: '-1.9s', color: 'bg-cyan-100' },
          ].map((star, i) => (
            <div
              key={i}
              className={`absolute rounded-full react-star ${star.size} ${star.color} shadow-[0_0_8px_rgba(255,255,255,0.8)]`}
              style={{ top: star.top, left: star.left, animationDelay: star.delay }}
            />
          ))}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full opacity-25 blur-3xl"
            style={{ background: primary }}
          />
        </div>
      )}

      {/* 3. Laser Beams (Angled Neon Beams) */}
      {effect === 'laser_beams' && (
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute -top-20 left-0 h-96 w-1 bg-gradient-to-b from-transparent via-cyan-400 to-transparent react-laser shadow-[0_0_15px_#22d3ee]"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute top-1/4 -left-10 h-96 w-1 bg-gradient-to-b from-transparent via-purple-400 to-transparent react-laser shadow-[0_0_15px_#c084fc]"
            style={{ animationDelay: '-3s' }}
          />
          <div
            className="absolute top-2/3 left-10 h-80 w-0.5 bg-gradient-to-b from-transparent via-emerald-400 to-transparent react-laser shadow-[0_0_12px_#34d399]"
            style={{ animationDelay: '-1.5s' }}
          />
        </div>
      )}

      {/* 4. Hyperspeed Light Beams */}
      {effect === 'hyperspeed' && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-[15%] top-0 h-40 w-0.5 bg-gradient-to-b from-transparent via-white to-transparent react-hyperspeed-beam" />
          <div className="absolute left-[38%] top-0 h-52 w-0.5 bg-gradient-to-b from-transparent via-cyan-300 to-transparent react-hyperspeed-beam" style={{ animationDelay: '-1.2s' }} />
          <div className="absolute left-[65%] top-0 h-36 w-0.5 bg-gradient-to-b from-transparent via-purple-300 to-transparent react-hyperspeed-beam" style={{ animationDelay: '-2.4s' }} />
          <div className="absolute left-[85%] top-0 h-48 w-0.5 bg-gradient-to-b from-transparent via-emerald-300 to-transparent react-hyperspeed-beam" style={{ animationDelay: '-0.7s' }} />
        </div>
      )}

      {/* 5. Tactile Film Grain */}
      {effect === 'film_grain' && (
        <div className="absolute inset-0 react-film-grain opacity-40 mix-blend-multiply" />
      )}

      {/* 6. Cyberpunk Matrix Grid & Scanlines */}
      {effect === 'cyber_grid' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 react-grid-pattern opacity-30" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-emerald-500/10 to-transparent react-scanline-flow" />
          <div
            className="absolute bottom-0 inset-x-0 h-32 opacity-20 blur-xl"
            style={{ background: 'linear-gradient(to top, #10B981, transparent)' }}
          />
        </div>
      )}

      {/* 7. Dot Matrix */}
      {effect === 'dot_grid' && (
        <div className="absolute inset-0 react-dot-pattern opacity-50" />
      )}

      {/* 8. Grid Mesh */}
      {effect === 'grid_warp' && (
        <div className="absolute inset-0 react-grid-pattern opacity-45" />
      )}

      {/* 9. Liquid Chrome / Iridescent Wave */}
      {effect === 'iridescent' && (
        <div
          className="absolute -inset-10 opacity-35 blur-2xl react-iridescent-flow"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #EC4899 0%, #8B5CF6 30%, #3B82F6 60%, transparent 80%)',
          }}
        />
      )}

      {/* 10. Floating Orbs */}
      {effect === 'particles' && (
        <>
          <div
            className="absolute left-[10%] top-[20%] h-28 w-28 rounded-full opacity-40 blur-2xl react-floating-orb"
            style={{ background: primary }}
          />
          <div
            className="absolute right-[15%] top-[55%] h-36 w-36 rounded-full opacity-35 blur-2xl react-floating-orb"
            style={{ background: '#06B6D4', animationDelay: '-3s' }}
          />
          <div
            className="absolute left-[25%] bottom-[15%] h-24 w-24 rounded-full opacity-30 blur-2xl react-floating-orb"
            style={{ background: '#F59E0B', animationDelay: '-5s' }}
          />
        </>
      )}
    </div>
  );
}
