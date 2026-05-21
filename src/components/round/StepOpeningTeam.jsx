import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Shuffle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Round, Player } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים', 'הצהובים', 'הכחולים', 'הכתומים'];

const TEAM_COLORS = [
  { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', text: 'text-yellow-600' },
  { bg: 'bg-gradient-to-r from-blue-600 to-blue-700', text: 'text-blue-600' },
  { bg: 'bg-gradient-to-r from-orange-500 to-orange-600', text: 'text-orange-600' },
  { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', text: 'text-yellow-600' },
  { bg: 'bg-gradient-to-r from-blue-600 to-blue-700', text: 'text-blue-600' },
  { bg: 'bg-gradient-to-r from-orange-500 to-orange-600', text: 'text-orange-600' },
];

export default function StepOpeningTeam({ numTeams, openingTeams, setOpeningTeams, teams, goalkeepers }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const randomOpeningTeam = () => {
    // הגרל 2 קבוצות שונות
    const indices = [];
    while (indices.length < 2) {
      const randomIndex = Math.floor(Math.random() * numTeams);
      if (!indices.includes(randomIndex)) {
        indices.push(randomIndex);
      }
    }
    setOpeningTeams(indices);
  };

  const handleSaveAndGoHome = async () => {
    setSaving(true);
    try {
      // שמירת המחזור
      await Round.create({
        date: new Date().toISOString(),
        teams,
        goalkeepers,
        openingTeams,
        teamWins: {}
      });
      
      // עדכון מספר ההופעות לכל שחקן
      const allPlayerIds = teams.flat();
      const players = await Player.list();

      const updatePromises = allPlayerIds.map(playerId => {
        const player = players.find(p => p.id === playerId);
        if (player) {
          return Player.update(playerId, {
            appearances: (player.appearances || 0) + 1
          });
        }
      });
      
      await Promise.all(updatePromises.filter(Boolean));

      // שליחת התראת Push לכל המשתמשים — fire-and-forget, לא חוסם ניווט
      fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'פורסמו הרכבים!',
          body: 'הרכבי המחזור החדש מוכנים — לחץ לצפייה',
          url: '/GameHistory',
        }),
      }).catch(() => {});

      toast.success('המחזור נשמר בהצלחה!');
      navigate(createPageUrl('Home'));
    } catch (error) {
      toast.error('שגיאה בשמירת המחזור');
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Success Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-center shadow-lg"
      >
        <div className="flex items-center justify-center gap-2 text-white mb-2">
          <Shuffle className="w-6 h-6" />
          <span className="text-lg font-bold">
            הכוחות אוזנו!
          </span>
        </div>
        <p className="text-white/90 text-sm">
          הקבוצות מאוזנות ומוכנות למשחק
        </p>
      </motion.div>

      {/* Draw Opening Team Button */}
      {!openingTeams && (
        <Button
          onClick={randomOpeningTeam}
          className="w-full h-16 text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl"
        >
          <Trophy className="w-6 h-6 ml-3" />
          הגרל משחק פותח
        </Button>
      )}

      {/* Opening Teams Banner */}
      <AnimatePresence>
        {openingTeams && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            {/* Football Field View */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-slate-200">
              <h2 className="text-center text-3xl font-bold mb-6 text-slate-800">
                הגרלת משחק פותח
              </h2>
              
              {/* Field Container */}
              <div className="relative bg-gradient-to-b from-green-400 via-green-500 to-green-400 rounded-2xl p-8 min-h-[400px] flex flex-col justify-between shadow-inner">
                {/* Field Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Border */}
                  <div className="absolute inset-4 border-4 border-white/40 rounded-xl" />
                  {/* Center Line */}
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-white/40" />
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-4 border-white/40 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/60 rounded-full" />
                  {/* Goal Areas */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-12 border-4 border-t-0 border-white/40 rounded-b-lg" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-12 border-4 border-b-0 border-white/40 rounded-t-lg" />
                </div>

                {/* Top Team */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`relative z-10 ${TEAM_COLORS[openingTeams[0]].bg} rounded-2xl px-8 py-6 shadow-2xl text-white`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black">
                      {TEAM_NAMES[openingTeams[0]]}
                    </span>
                  </div>
                </motion.div>

                {/* VS Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                  className="relative z-10 mx-auto"
                >
                  <div className="bg-gradient-to-br from-red-400 via-red-500 to-pink-500 rounded-full w-24 h-24 flex items-center justify-center shadow-2xl border-4 border-white">
                    <span className="text-white font-black text-4xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                      VS
                    </span>
                  </div>
                </motion.div>

                {/* Bottom Team */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`relative z-10 ${TEAM_COLORS[openingTeams[1]].bg} rounded-2xl px-8 py-6 shadow-2xl text-white`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black">
                      {TEAM_NAMES[openingTeams[1]]}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Shuffle Button */}
              <button
                onClick={randomOpeningTeam}
                className="mt-4 text-slate-500 text-sm hover:text-slate-700 underline w-full"
              >
                🎲 הגרל מחדש
              </button>
            </div>

            <Button
              onClick={handleSaveAndGoHome}
              disabled={saving}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-xl rounded-2xl"
            >
              {saving ? 'שומר...' : 'מסך הבית'}
              <Home className="w-6 h-6 mr-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}