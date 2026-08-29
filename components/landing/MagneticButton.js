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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  function handleMouseMove(e) {
    if (!buttonRef.current || prefersReducedMotion) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    setPosition({ x: deltaX, y: deltaY });
  }

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  }

  function handleClick(e) {
    if (!prefersReducedMotion) {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 300);
    }
    if (onClick) onClick(e);
  }

  const Comp = href ? 'a' : as;

  const style = prefersReducedMotion
    ? {}
    : {
        transform: `translate(${position.x}px, ${position.y}px) scale(${isClicked ? 0.95 : isHovered ? 1.03 : 1})`,
        transition: isHovered ? 'transform 0.12s ease-out' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      };

  return (
    <Comp
      ref={buttonRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={style}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
