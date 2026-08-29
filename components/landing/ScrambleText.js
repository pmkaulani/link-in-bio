'use client';
import { useState, useEffect, useRef } from 'react';

const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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

export default function ScrambleText({
  text = '',
  className = '',
  triggerOnHover = true,
  autoPlay = false,
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  function startScramble() {
    if (isScrambling || prefersReducedMotion) return;
    setIsScrambling(true);

    let iteration = 0;
    const maxIterations = text.length;

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return text[index];
            }
            if (char === ' ') return ' ';
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iteration >= maxIterations) {
        clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsScrambling(false);
      }

      iteration += 1 / 2.5;
    }, 25);
  }

  useEffect(() => {
    if (autoPlay && !prefersReducedMotion) {
      startScramble();
    }
    return () => clearInterval(intervalRef.current);
  }, [text, autoPlay, prefersReducedMotion]);

  return (
    <span
      onMouseEnter={triggerOnHover && !prefersReducedMotion ? startScramble : undefined}
      className={`font-inherit inline-block cursor-default ${className}`}
    >
      {displayText}
    </span>
  );
}
