import React from 'react';

/* ═══════════════════════════════════════════════════════════════════
   CLUB LOGO — the owner's original SYNTHETICO design, as designed:
   the FULL lockup (ball + glitch wordmark). Both assets are cut from
   public/logo-source.png with the outside background keyed out:
   /logo-full.png — ball + SYNTHETICO (default)
   /logo-ball.png — ball only (variant="ball" for tight square spots)
   ═══════════════════════════════════════════════════════════════════ */

export default function ClubCrest({ className = 'h-12 w-auto', variant = 'full', title = 'סינתטיקו חולון' }) {
  return (
    <img
      src={variant === 'ball' ? '/logo-ball.png' : '/logo-full.png'}
      alt={title}
      draggable="false"
      className={`object-contain select-none ${className}`}
    />
  );
}
