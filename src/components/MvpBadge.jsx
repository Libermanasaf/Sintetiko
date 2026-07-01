import React from 'react';
import { Trophy } from 'lucide-react';

// "MVP ×N" chip shown next to a player's name — N = total times they were a
// round's MVP (most votes in a closed round, counted only after the 48h voting
// window closes; season resets 2026-07-01, see mvp_counts() RPC). Renders
// nothing for count 0 so it only appears for actual winners.
export default function MvpBadge({ count, className = '' }) {
  if (!count || count < 1) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full st-foil shadow-[0_2px_8px_-2px_rgba(250,204,21,0.7)] shrink-0 ${className}`}
      title={`נבחר למצטיין המחזור ${count} פעמים`}
    >
      <Trophy className="w-3 h-3" strokeWidth={2.6} />
      MVP ×{count}
    </span>
  );
}
