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

export default function TiltCard({
  children,
  className = '',
  maxTilt = 12,
  glare = true,
  ...props
}) {
  const cardRef = useRef(null);
  const innerRef = useRef(null);
  const glareRef = useRef(null);
  const rafRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  function handleMouseMove(e) {
    if (!cardRef.current || !innerRef.current || prefersReducedMotion) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current || !innerRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      innerRef.current.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;

      if (glareRef.current) {
        const gx = (x / rect.width) * 100;
        const gy = (y / rect.height) * 100;
        glareRef.current.style.background = `radial-gradient(circle at ${gx.toFixed(1)}% ${gy.toFixed(1)}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
      }
    });
  }

  function handleMouseLeave() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (innerRef.current) {
      innerRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
    if (glareRef.current) {
      glareRef.current.style.background = 'transparent';
    }
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: prefersReducedMotion ? 'none' : '1000px',
      }}
      className={`relative ${className}`}
      {...props}
    >
      <div
        ref={innerRef}
        style={{
          transformStyle: prefersReducedMotion ? 'flat' : 'preserve-3d',
          transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
        }}
        className="w-full h-full relative"
      >
        {children}

        {glare && !prefersReducedMotion && (
          <div
            ref={glareRef}
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          />
        )}
      </div>
    </div>
  );
}
