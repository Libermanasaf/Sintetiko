import React from 'react';
import { Trophy } from 'lucide-react';

// "MVP ×N" chip shown next to a player's name when they've been a round's MVP at
// least once. Renders nothing for count 0 so it only appears for winners.
export default function MvpBadge({ count, className = '' }) {
  if (!count || count < 1) return null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[0.6rem] font-black px-1.5 py-0.5 rounded-full st-foil shadow-[0_2px_8px_-2px_rgba(250,204,21,0.7)] shrink-0 ${className}`}
      title={`נבחר למצטיין ${count} פעמים`}
    >
      <Trophy className="w-2.5 h-2.5" strokeWidth={2.6} />
      MVP ×{count}
    </span>
  );
}
