import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

// A slim banner shown at the top whenever the device loses connectivity. The
// app shell still renders (cached by the service worker), but live data from
// Supabase can't load offline — this tells the user why instead of leaving them
// staring at empty/loading screens. Auto-hides the moment connection returns.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-[70] flex items-center justify-center gap-2 py-2 px-4 bg-rose-600/95 text-white text-sm font-black shadow-lg backdrop-blur-sm"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      אין חיבור לאינטרנט — חלק מהנתונים עשויים לא להתעדכן
    </div>
  );
}
