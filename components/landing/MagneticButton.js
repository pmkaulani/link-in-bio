'use client';
import { useRef, useState, useEffect } from 'react';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export default function MagneticButton({
  children,
  className = '',
  strength = 0.25,
  onClick,
  href,
  as = 'button',
  ...props
}) {
  const buttonRef = useRef(null);
  const rafRef = useRef(null);
  const isHoveredRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  function handleMouseMove(e) {
    if (!buttonRef.current || prefersReducedMotion) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      buttonRef.current.style.transform = `translate(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px) scale(1.03)`;
    });
  }

  function handleMouseEnter() {
    isHoveredRef.current = true;
    if (buttonRef.current && !prefersReducedMotion) {
      buttonRef.current.style.transition = 'transform 0.12s ease-out';
    }
  }

  function handleMouseLeave() {
    isHoveredRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (buttonRef.current && !prefersReducedMotion) {
      buttonRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      buttonRef.current.style.transform = 'translate(0px, 0px) scale(1)';
    }
  }

  function handleClick(e) {
    if (buttonRef.current && !prefersReducedMotion) {
      buttonRef.current.style.transform = 'translate(0px, 0px) scale(0.95)';
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.style.transform = isHoveredRef.current
            ? 'translate(0px, 0px) scale(1.03)'
            : 'translate(0px, 0px) scale(1)';
        }
      }, 150);
    }
    if (onClick) onClick(e);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const Comp = href ? 'a' : as;

  return (
    <Comp
      ref={buttonRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
