import React from 'react';

/* ═══════════════════════════════════════════════════════════════════
   CLUB LOGO — the owner's original SYNTHETICO ball mark.
   /logo-ball.png is cut from public/logo-source.png (the designed
   lockup): background keyed to transparent, ball cropped square —
   see the full lockup at /logo-full.png for hero/landing uses.
   ═══════════════════════════════════════════════════════════════════ */

export default function ClubCrest({ className = 'h-12 w-12', title = 'סינתטיקו חולון' }) {
  return (
    <img
      src="/logo-ball.png"
      alt={title}
      draggable="false"
      className={`object-contain select-none ${className}`}
    />
  );
}
