'use client';

import { useState } from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
} from 'lucide-react';

const VARIANT_CONFIGS = {
  info: {
    icon: Info,
    containerClass: 'border-zinc-800 bg-zinc-900/90 text-zinc-200 shadow-sm',
    iconClass: 'text-zinc-400',
    titleClass: 'text-white',
    role: 'status',
  },
  success: {
    icon: CheckCircle2,
    containerClass: 'border-zinc-800 bg-zinc-900/90 text-zinc-200 shadow-sm',
    iconClass: 'text-emerald-400',
    titleClass: 'text-white',
    role: 'status',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-amber-900/40 bg-amber-950/20 text-amber-200 shadow-sm',
    iconClass: 'text-amber-400',
    titleClass: 'text-amber-100',
    role: 'alert',
  },
  error: {
    icon: AlertOctagon,
    containerClass: 'border-rose-900/40 bg-rose-950/20 text-rose-200 shadow-sm',
    iconClass: 'text-rose-400',
    titleClass: 'text-rose-100',
    role: 'alert',
  },
};

/**
 * Accessible, styled Alert component supporting info, success, warning, and error states.
 *
 * @param {Object} props
 * @param {'info' | 'success' | 'warning' | 'error'} [props.variant='info']
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 * @param {() => void} [props.onClose]
 * @param {boolean} [props.dismissible=false]
 * @param {string} [props.className]
 */
export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  dismissible = false,
  className = '',
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.info;
  const IconComponent = config.icon;

  const handleDismiss = () => {
    setDismissed(true);
    if (onClose) onClose();
  };

  return (
    <div
      role={config.role}
      className={`relative flex items-start gap-3 rounded-2xl border p-4 text-xs md:text-sm backdrop-blur-md transition-all ${config.containerClass} ${className}`}
    >
      <IconComponent size={18} className={`shrink-0 mt-0.5 ${config.iconClass}`} />

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-semibold tracking-tight mb-1 ${config.titleClass}`}>
            {title}
          </h4>
        )}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>

      {(dismissible || onClose) && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 transition-all"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
