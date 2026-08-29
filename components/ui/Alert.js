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
    containerClass: 'border-zinc-300 bg-zinc-50 text-zinc-800 shadow-sm',
    badgeClass: 'bg-zinc-200 text-zinc-800',
    titleClass: 'text-black',
    role: 'status',
  },
  success: {
    icon: CheckCircle2,
    containerClass: 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    titleClass: 'text-emerald-950',
    role: 'status',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-amber-200 bg-amber-50 text-amber-900 shadow-sm',
    badgeClass: 'bg-amber-100 text-amber-700',
    titleClass: 'text-amber-950',
    role: 'alert',
  },
  error: {
    icon: AlertOctagon,
    containerClass: 'border-red-200 bg-red-50 text-red-900 shadow-sm',
    badgeClass: 'bg-red-100 text-red-700',
    titleClass: 'text-red-950',
    role: 'alert',
  },
};

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
      className={`relative flex items-start gap-3.5 rounded-2xl border p-4 sm:p-5 text-xs sm:text-sm font-medium transition-all ${config.containerClass} ${className}`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.badgeClass}`}>
        <IconComponent size={20} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <h4 className={`text-sm sm:text-base font-bold tracking-tight mb-1 ${config.titleClass}`}>
            {title}
          </h4>
        )}
        <div className="leading-relaxed">{children}</div>
      </div>

      {(dismissible || onClose) && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 -mr-1 -mt-1 p-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition-all"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
