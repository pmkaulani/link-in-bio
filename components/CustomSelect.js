'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options = [], placeholder = 'Select an option' }) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listboxRef = useRef(null);

  // Reset focused index when opening
  useEffect(() => {
    if (open) {
      const currentIndex = options.findIndex((opt) => Array.isArray(opt) && String(opt[0]) === String(value));
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [open, value, options]);

  // Scroll focused option into view
  useEffect(() => {
    if (open && focusedIndex >= 0 && listboxRef.current) {
      const focusedEl = listboxRef.current.children[focusedIndex];
      if (focusedEl) {
        focusedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, open]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex][0]);
          setOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  }, [open, focusedIndex, options, onChange]);

  const selectedOption = options.find((opt) => Array.isArray(opt) && String(opt[0]) === String(value));
  const displayLabel = selectedOption ? selectedOption[1] : (value || placeholder);

  const activeDescendantId = focusedIndex >= 0 && options[focusedIndex]
    ? `custom-select-option-${String(options[focusedIndex][0])}`
    : undefined;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={`flex w-full items-center justify-between rounded-[8px] border bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-brand-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-100 ${
          open ? 'border-brand-500 ring-2 ring-brand-100' : 'border-brand-100 hover:border-brand-300'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-activedescendant={open ? activeDescendantId : undefined}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-brand-900/40 transition-transform duration-200 ${open ? 'rotate-180 text-brand-500' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-[12px] border border-zinc-200 bg-white p-1.5 shadow-elevated transition-all">
          <div className="flex flex-col gap-0.5" role="listbox" ref={listboxRef}>
            {options.map(([optVal, optLabel], index) => {
              const isSelected = String(optVal) === String(value);
              const isFocused = index === focusedIndex;
              return (
                <button
                  key={String(optVal)}
                  id={`custom-select-option-${String(optVal)}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(optVal);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-brand-50 text-brand-800'
                      : isFocused
                        ? 'bg-brand-50/60 text-brand-900'
                        : 'text-brand-900/70 hover:bg-brand-50/60 hover:text-brand-900'
                  }`}
                >
                  <span className="truncate">{optLabel}</span>
                  {isSelected && <Check size={14} className="shrink-0 text-brand-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
