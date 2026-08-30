'use client';
import { useEffect, useRef } from 'react';

const COLORS = ['#000000', '#10B981', '#6366F1', '#EC4899', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function ConfettiBurst({ onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 65 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2.5,
      r: Math.random() * 5 + 3,
      dx: (Math.random() - 0.5) * 16,
      dy: (Math.random() - 0.8) * 16,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      dr: (Math.random() - 0.5) * 10,
    }));

    let animId;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.45; // gravity
        p.alpha -= 0.015;
        p.rotation += p.dr;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 1.5);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(render);
      } else {
        onComplete?.();
      }
    }

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}
