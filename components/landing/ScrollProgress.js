'use client';
import { useState, useEffect } from 'react';

const STAGES = [
  { id: 'hero', label: 'Intro' },
  { id: 'customize', label: 'Customize' },
  { id: 'animations', label: 'Physics' },
  { id: 'themes', label: 'Themes' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'audience', label: 'Creators' },
  { id: 'faq', label: 'FAQ' },
];

export default function ScrollProgress() {
  const [activeStage, setActiveStage] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }

      // Check active sections
      for (const stage of [...STAGES].reverse()) {
        const el = document.getElementById(stage.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.4) {
            setActiveStage(stage.id);
            break;
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }

  return (
    <>
      {/* Top Thin Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-white/60 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Stage Navigator (Desktop) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-3 pointer-events-auto">
        {STAGES.map((stage) => {
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => scrollToSection(stage.id)}
              className="group flex items-center gap-2 text-right transition"
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition duration-200 ${
                  isActive
                    ? 'text-white opacity-100 translate-x-0'
                    : 'text-zinc-500 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'
                }`}
              >
                {stage.label}
              </span>
              <span
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                    : 'w-2 bg-zinc-800 group-hover:bg-zinc-500'
                }`}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
