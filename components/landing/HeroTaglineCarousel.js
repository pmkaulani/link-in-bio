'use client';
import { useState, useEffect } from 'react';

const TAGLINES = [
  {
    prefix: 'ONE LINK.',
    highlight: 'ALL OF YOU.',
    accentStyle: 'text-white',
  },
  {
    prefix: 'ALL YOUR LINKS.',
    highlight: 'IN ONE PLACE.',
    accentStyle: 'text-zinc-300',
  },
  {
    prefix: 'ONE SIMPLE LINK.',
    highlight: 'EVERYTHING YOU SHARE.',
    accentStyle: 'text-white',
  },
  {
    prefix: 'YOUR ONLINE WORLD.',
    highlight: 'IN ONE LINK.',
    accentStyle: 'text-zinc-300',
  },
  {
    prefix: 'SHARE MORE.',
    highlight: 'WITH ONE SIMPLE LINK.',
    accentStyle: 'text-white',
  },
];

export default function HeroTaglineCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full select-none"
    >
      {/* Rolling Cylinder Window */}
      <div className="relative h-[110px] sm:h-[150px] lg:h-[175px] overflow-hidden">
        <div
          className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col"
          style={{
            transform: `translateY(-${currentIndex * 20}%)`,
            height: `${TAGLINES.length * 100}%`,
          }}
        >
          {TAGLINES.map((item, idx) => {
            const isActive = currentIndex === idx;
            return (
              <div
                key={idx}
                className={`h-[110px] sm:h-[150px] lg:h-[175px] flex flex-col justify-center transition-all duration-700 ${
                  isActive
                    ? 'opacity-100 scale-100 filter-none'
                    : 'opacity-15 scale-[0.97] blur-[1.5px]'
                }`}
              >
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]">
                  <span className="block text-zinc-500 uppercase">{item.prefix}</span>
                  <span className={`block uppercase font-black ${item.accentStyle}`}>
                    {item.highlight}
                  </span>
                </h1>
              </div>
            );
          })}
        </div>
      </div>

      {/* Discreet Animated Progress Track */}
      <div className="mt-2 flex items-center justify-center lg:justify-start gap-2">
        {TAGLINES.map((_, idx) => {
          const isActive = currentIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="group py-2 focus:outline-none"
              aria-label={`Jump to tagline ${idx + 1}`}
            >
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  isActive
                    ? 'w-8 bg-white shadow-sm'
                    : 'w-2 bg-zinc-800 hover:bg-zinc-600'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
