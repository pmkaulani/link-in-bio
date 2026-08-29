'use client';

export default function BrandLogo({
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant = 'full', // 'full' (icon + text) | 'icon' (just icon) | 'text' (just wordmark)
  theme = 'dark', // 'dark' (black) | 'light' (white) | 'current' (inherit currentColor)
  className = '',
}) {
  const iconSizes = {
    xs: 'h-5 w-5 rounded-[8px]',
    sm: 'h-6 w-6 rounded-[8px]',
    md: 'h-8 w-8 rounded-[8px]',
    lg: 'h-10 w-10 rounded-[8px]',
    xl: 'h-12 w-12 rounded-[8px]',
  };

  const textSizes = {
    xs: 'text-xs tracking-tight',
    sm: 'text-sm tracking-tight',
    md: 'text-[15px] tracking-tight',
    lg: 'text-lg tracking-tight',
    xl: 'text-2xl tracking-tighter',
  };

  const textColorClass =
    theme === 'current'
      ? 'text-current'
      : theme === 'light'
      ? 'text-white'
      : 'text-black';

  return (
    <div className={`inline-flex items-center gap-1.5 select-none font-sans ${className}`}>
      {/* Minimalist Monochrome Link Glyph */}
      {(variant === 'full' || variant === 'icon') && (
        <div
          className={`flex items-center justify-center transition-transform duration-200 hover:scale-105 ${
            theme === 'light'
              ? 'bg-white text-black'
              : theme === 'current'
              ? 'bg-current/15 text-current'
              : 'bg-black text-white'
          } ${iconSizes[size] || iconSizes.md}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[52%] w-[52%]"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
      )}

      {/* Pure Typographic Wordmark */}
      {(variant === 'full' || variant === 'text') && (
        <div className={`flex items-baseline font-black leading-none ${textSizes[size] || textSizes.md}`}>
          <span className={textColorClass}>
            LINK<span className="opacity-40 font-light mx-0.5">·</span>IN<span className="opacity-40 font-light mx-0.5">·</span>BIO
          </span>
        </div>
      )}
    </div>
  );
}
