import React from 'react';

/* ═══════════════════════════════════════════════════════════════════
   CLUB LOGO — the one source of truth for the Sintetiko Holon mark.
   A clean cream-gold line-art football (true truncated-icosahedron
   projection): filled center pentagon, five rim pentagons, hexagon
   seams. Matches the brand reference; transparent, scales anywhere.
   ═══════════════════════════════════════════════════════════════════ */

const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => [r * Math.cos(rad(a)), r * Math.sin(rad(a))];
const fmt = ([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`;

// point-down pentagon path with circumradius R (local coords, y-down)
const pentPath = (R) => {
  const pts = [90, 18, -54, -126, -198].map((a) => pt(R, a));
  return `M${pts.map(fmt).join(' L')} Z`;
};

// rotate a local point by `rot` degrees, then translate to center [cx, cy]
const place = ([x, y], rot, [cx, cy]) => {
  const c = Math.cos(rad(rot));
  const s = Math.sin(rad(rot));
  return [cx + x * c - y * s, cy + x * s + y * c];
};

const V_ANGLES = [90, 162, 234, 306, 18];   // center-pentagon vertices
const P_ANGLES = [54, 126, 198, 270, 342];  // rim-pentagon directions

const CENTER_PENT = pentPath(34);
const RIM_PENT = pentPath(30);

// seam spokes: center-pentagon vertex → hexagon junction
const SPOKES = V_ANGLES.map((a) => [pt(34, a), pt(58, a)]);

// seam forks: each junction splits toward the two adjacent rim pentagons
const FORKS = V_ANGLES.flatMap((a) => {
  const w = pt(58, a);
  const toA = place(pt(30, 18), a - 36 - 270, pt(92, a - 36));
  const toB = place(pt(30, 162), a + 36 - 270, pt(92, a + 36));
  return [[w, toA], [w, toB]];
});

export default function ClubCrest({ className = 'h-12 w-12', title = 'סינתטיקו חולון' }) {
  return (
    <svg viewBox="-110 -110 220 220" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="cbGold" x1="0" y1="-100" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8ecb8" />
          <stop offset="100%" stopColor="#e4c164" />
        </linearGradient>
        <clipPath id="cbClip">
          <circle r="93.5" />
        </clipPath>
      </defs>

      {/* ball outline */}
      <circle r="97" fill="none" stroke="url(#cbGold)" strokeWidth="7" />

      {/* rim pentagons — dark patches, clipped by the ball edge */}
      <g clipPath="url(#cbClip)">
        {P_ANGLES.map((f) => {
          const [cx, cy] = pt(92, f);
          return (
            <path
              key={f}
              d={RIM_PENT}
              transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${f - 270})`}
              fill="none"
              stroke="url(#cbGold)"
              strokeWidth="6"
              strokeLinejoin="round"
            />
          );
        })}
      </g>

      {/* center pentagon — the filled gold patch */}
      <path d={CENTER_PENT} fill="url(#cbGold)" />

      {/* hexagon seams */}
      <g stroke="url(#cbGold)" strokeWidth="6" strokeLinecap="round">
        {SPOKES.map(([a, b], i) => (
          <line key={`s${i}`} x1={a[0].toFixed(2)} y1={a[1].toFixed(2)} x2={b[0].toFixed(2)} y2={b[1].toFixed(2)} />
        ))}
        {FORKS.map(([a, b], i) => (
          <line key={`f${i}`} x1={a[0].toFixed(2)} y1={a[1].toFixed(2)} x2={b[0].toFixed(2)} y2={b[1].toFixed(2)} />
        ))}
      </g>
    </svg>
  );
}
