import React from 'react';
import { Crown } from 'lucide-react';

// Crown chip shown next to a player's name — N = times they finished FIRST on a
// podium (players.podium_titles, incremented when a podium season is closed).
// Renders nothing for count 0, so it only ever marks an actual champion.
//
// Deliberately mirrors MvpBadge: same chip shape and gold foil, so the two read
// as one family of honours rather than two unrelated decorations.
export default function PodiumKingBadge({ count, className = '' }) {
  if (!count || count < 1) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full st-foil shadow-[0_2px_8px_-2px_rgba(250,204,21,0.7)] shrink-0 ${className}`}
      title={count === 1 ? 'מלך הפודיום' : `מלך הפודיום ×${count}`}
    >
      <Crown className="w-3 h-3" strokeWidth={2.6} />
      {count === 1 ? 'מלך הפודיום' : `מלך הפודיום ×${count}`}
    </span>
  );
}
