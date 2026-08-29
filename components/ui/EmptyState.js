import Link from 'next/link';

/**
 * Reusable empty state component following the LinkBio dark/glass design language.
 *
 * @param {Object} props
 * @param {React.ElementType} [props.icon] Lucide icon component
 * @param {string} props.title Primary headline
 * @param {string} [props.description] Secondary description
 * @param {string} [props.actionLabel] Text for primary action button
 * @param {() => void} [props.onAction] Click handler for button
 * @param {string} [props.actionHref] URL for link action
 * @param {React.ReactNode} [props.secondaryAction] Optional secondary CTA
 * @param {string} [props.className] Custom CSS classes
 */
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
      className={`flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] p-8 md:p-12 text-center backdrop-blur-md ${className}`}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400 mb-4 shadow-inner">
          <Icon size={24} className="text-zinc-300" />
        </div>
      )}

      <h3 className="text-base md:text-lg font-bold text-white tracking-tight mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="max-w-sm text-xs md:text-sm text-zinc-400 mb-6 leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs md:text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-400 transition-all"
          >
            {actionLabel}
          </Link>
        )}

        {!actionHref && onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs md:text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-400 transition-all"
          >
            {actionLabel}
          </button>
        )}

        {secondaryAction}
      </div>
    </div>
  );
}
