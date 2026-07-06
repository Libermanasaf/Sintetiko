import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const BURST_COLORS = ['#fbbf24', '#fde68a', '#f59e0b', '#ffffff', '#fcd34d'];

/* ─── One-shot gold confetti burst + expanding flash ring ────────
   `force` bypasses reduced-motion: a user-initiated burst may always
   play. `className` positions the (pointer-transparent) container. */
export default function GoldBurst({
  delay = 0,
  count = 26,
  force = false,
  className = 'absolute inset-x-0 top-8 z-30',
}) {
  const reduce = useReducedMotion() && !force;
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
        dist: 60 + Math.random() * 80,
        size: 4 + Math.random() * 5,
        color: BURST_COLORS[i % BURST_COLORS.length],
        rot: Math.random() * 300 - 150,
        dur: 1.0 + Math.random() * 0.8,
        round: Math.random() > 0.5,
      })),
    [count],
  );
  if (reduce) return null;
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      {/* expanding flash ring — the "pop" that sells the burst */}
      <motion.span
        initial={{ x: '-50%', opacity: 0, scale: 0.2 }}
        animate={{ x: '-50%', opacity: [0, 0.9, 0], scale: [0.2, 1.9, 2.4] }}
        transition={{ delay, duration: 0.7, ease: 'easeOut' }}
        className="absolute w-16 h-16 rounded-full"
        style={{
          left: '50%',
          top: -8,
          border: '2px solid rgba(253,230,138,0.9)',
          boxShadow: '0 0 24px 6px rgba(251,191,36,0.5)',
        }}
      />
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
          animate={{
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist * 0.85 + 46,   // outward, then a slight fall
            opacity: [0, 1, 1, 0],
            rotate: p.rot,
            scale: [1, 1, 0.6],
          }}
          transition={{ delay: delay + Math.random() * 0.12, duration: p.dur, ease: 'easeOut' }}
          className="absolute"
          style={{
            left: '50%',           // explicit anchor — abspos static position varies across browsers
            top: 0,
            width: p.size,
            height: p.size * (p.round ? 1 : 1.9),
            background: p.color,
            borderRadius: p.round ? '9999px' : '1px',
            boxShadow: '0 0 6px rgba(251,191,36,0.6)',
          }}
        />
      ))}
    </div>
  );
}
