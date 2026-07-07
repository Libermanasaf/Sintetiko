import React from 'react';

/* ═══════════════════════════════════════════════════════════════════
   CLUB CREST — the one source of truth for the Sintetiko Holon emblem.
   A proper football-club shield: layered gold rim, striped pitch field,
   championship star, a real pentagon football and a chevron echoing the
   shield's point. Scales from the 40px header to hero sizes.
   ═══════════════════════════════════════════════════════════════════ */

const PENT = 'M0,-19 L18.07,-5.87 L11.17,15.37 L-11.17,15.37 L-18.07,-5.87 Z';

export default function ClubCrest({ className = 'h-12 w-auto', title = 'סינתטיקו חולון' }) {
  return (
    <svg viewBox="0 0 100 118" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="ccGold" x1="12" y1="4" x2="88" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fdeebc" />
          <stop offset="30%" stopColor="#f5c84f" />
          <stop offset="55%" stopColor="#c98d1b" />
          <stop offset="78%" stopColor="#f3cf6b" />
          <stop offset="100%" stopColor="#8f6210" />
        </linearGradient>
        <linearGradient id="ccGoldSoft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3cf" />
          <stop offset="55%" stopColor="#f0c445" />
          <stop offset="100%" stopColor="#a97812" />
        </linearGradient>
        <linearGradient id="ccField" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f4f39" />
          <stop offset="60%" stopColor="#093225" />
          <stop offset="100%" stopColor="#04100b" />
        </linearGradient>
        <radialGradient id="ccSheen" cx="36%" cy="30%" r="74%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="58%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="ccInner">
          <path d="M50,9.5 L83.5,19 V51.5 C83.5,79 64.5,95.5 50,106.5 C35.5,95.5 16.5,79 16.5,51.5 V19 Z" />
        </clipPath>
        <clipPath id="ccBall">
          <circle r="47" />
        </clipPath>
      </defs>

      {/* gold rim */}
      <path
        d="M50,3 L89,14 V52 C89,84 68,102 50,114 C32,102 11,84 11,52 V14 Z"
        fill="url(#ccGold)"
      />
      {/* field */}
      <path
        d="M50,9.5 L83.5,19 V51.5 C83.5,79 64.5,95.5 50,106.5 C35.5,95.5 16.5,79 16.5,51.5 V19 Z"
        fill="url(#ccField)"
      />
      <path
        d="M50,9.5 L83.5,19 V51.5 C83.5,79 64.5,95.5 50,106.5 C35.5,95.5 16.5,79 16.5,51.5 V19 Z"
        fill="none" stroke="#f7dc8e" strokeWidth="0.9" strokeOpacity="0.55"
      />

      {/* mowed-pitch stripes + overhead light */}
      <g clipPath="url(#ccInner)">
        <rect x="24" y="9" width="10.5" height="100" fill="#ffffff" opacity="0.05" />
        <rect x="44.75" y="9" width="10.5" height="100" fill="#ffffff" opacity="0.05" />
        <rect x="65.5" y="9" width="10.5" height="100" fill="#ffffff" opacity="0.05" />
        <path d="M16,9 H84 V33 C62,41 38,41 16,33 Z" fill="#ffffff" opacity="0.06" />
      </g>

      {/* championship star */}
      <g transform="translate(50 24) scale(1.15)">
        <path
          d="M0,-7 L1.71,-2.35 L6.66,-2.16 L2.76,0.9 L4.11,5.66 L0,2.9 L-4.11,5.66 L-2.76,0.9 L-6.66,-2.16 L-1.71,-2.35 Z"
          fill="url(#ccGoldSoft)" stroke="#8f6210" strokeWidth="0.5"
        />
      </g>

      {/* pentagon football */}
      <g transform="translate(50 64.5) scale(0.42)">
        <circle r="50" fill="#060b16" />
        <g clipPath="url(#ccBall)">
          <g fill="url(#ccGoldSoft)">
            <g transform="translate(0 -50) rotate(180)"><path d={PENT} /></g>
            <g transform="translate(47.55 -15.45) rotate(252)"><path d={PENT} /></g>
            <g transform="translate(29.39 40.45) rotate(324)"><path d={PENT} /></g>
            <g transform="translate(-29.39 40.45) rotate(36)"><path d={PENT} /></g>
            <g transform="translate(-47.55 -15.45) rotate(108)"><path d={PENT} /></g>
          </g>
          <g stroke="url(#ccGoldSoft)" strokeWidth="3.6" strokeLinecap="round">
            <line x1="0" y1="-21" x2="0" y2="-47" />
            <line x1="19.97" y1="-6.49" x2="44.70" y2="-14.52" />
            <line x1="12.34" y1="16.99" x2="27.62" y2="38.02" />
            <line x1="-12.34" y1="16.99" x2="-27.62" y2="38.02" />
            <line x1="-19.97" y1="-6.49" x2="-44.70" y2="-14.52" />
          </g>
          <path
            d="M0,-21 L19.97,-6.49 L12.34,16.99 L-12.34,16.99 L-19.97,-6.49 Z"
            fill="url(#ccGoldSoft)"
          />
          <circle r="47" fill="url(#ccSheen)" />
        </g>
        <circle r="47" fill="none" stroke="url(#ccGold)" strokeWidth="4" />
      </g>

      {/* chevron echoing the shield point */}
      <path
        d="M38,94 L50,100.5 L62,94"
        fill="none" stroke="url(#ccGoldSoft)" strokeWidth="2.2"
        strokeLinecap="round" strokeOpacity="0.9"
      />
    </svg>
  );
}
