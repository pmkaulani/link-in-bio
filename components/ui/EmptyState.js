import Link from 'next/link';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 md:p-12 text-center backdrop-blur-md ${className}`}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 mb-4 shadow-inner">
          <Icon size={22} className="text-zinc-300" />
        </div>
      )}

      <h3 className="text-base font-bold text-white tracking-tight mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="max-w-sm text-xs text-zinc-400 mb-6 leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all shadow-sm"
          >
            {actionLabel}
          </Link>
        )}

        {!actionHref && onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all shadow-sm"
          >
            {actionLabel}
          </button>
        )}

        {secondaryAction}
      </div>
    </div>
  );
}
