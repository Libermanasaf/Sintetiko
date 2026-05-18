import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Minus, Save, CheckCircle, User, Star, Shield, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Round, Player } from '@/api/entities';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TEAM_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-600' },
  { bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-600' },
  { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-600' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-600' },
  { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-600' },
  { bg: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-600' },
];

const TEAM_NAMES = ['קבוצה א׳', 'קבוצה ב׳', 'קבוצה ג׳', 'קבוצה ד׳', 'קבוצה ה׳', 'קבוצה ו׳'];

export default function StepResults({
  teams,
  goalkeepers,
  openingTeams,
  players,
}) {
  const navigate = useNavigate();
  const [teamWins, setTeamWins] = useState({});
  const [saved, setSaved] = useState(false);

  const incrementWins = (teamIndex) => {
    setTeamWins((prev) => ({
      ...prev,
      [teamIndex]: (prev[teamIndex] || 0) + 1,
    }));
  };

  const decrementWins = (teamIndex) => {
    setTeamWins((prev) => ({
      ...prev,
      [teamIndex]: Math.max(0, (prev[teamIndex] || 0) - 1),
    }));
  };

  const handleSave = () => {
    setSaved(true);
    toast.success('התוצאה נשמרה זמנית');
  };

  const handleFinishRound = async () => {
    try {
      // מצא את מספר הניצחונות המקסימלי
      let maxWins = 0;
      teams.forEach((_, teamIndex) => {
        const wins = teamWins[teamIndex] || 0;
        if (wins > maxWins) maxWins = wins;
      });

      if (maxWins === 0) {
        toast.error('לא נבחרה קבוצה מנצחת');
        return;
      }

      // בדוק שוויון — כמה קבוצות הגיעו לניצחונות המקסימליים
      const teamsWithMaxWins = teams.filter((_, i) => (teamWins[i] || 0) === maxWins);
      const isTie = teamsWithMaxWins.length > 1;

      // קבע קבוצה מנצחת רק אם אין שוויון
      const winningTeamIndex = isTie
        ? null
        : teams.findIndex((_, i) => (teamWins[i] || 0) === maxWins);

      // עדכן גביעים רק אם אין שוויון
      const updates = [];
      if (!isTie) {
        teams[winningTeamIndex].forEach((playerId) => {
          const player = players.find((p) => p.id === playerId);
          if (player) {
            updates.push(
              Player.update(playerId, {
                wins: (player.wins || 0) + 1,
              })
            );
          }
        });
      }

      // שמור את המחזור להיסטוריה
      const roundData = {
        date: new Date().toISOString(),
        teams: teams,
        goalkeepers: goalkeepers,
        openingTeams: openingTeams,
        winningTeam: winningTeamIndex,
        teamWins: teamWins,
      };

      await Promise.all([
        ...updates,
        Round.create(roundData),
      ]);

      if (isTie) {
        toast.success('המחזור הסתיים בשוויון — לא חולקו גביעים');
      } else {
        toast.success(`המחזור הסתיים! ניצחון נוסף לשחקני ${TEAM_NAMES[winningTeamIndex]}`);
      }

      setTimeout(() => {
        navigate(createPageUrl('Home'));
      }, 1500);
    } catch (error) {
      toast.error('שגיאה בסיום המחזור');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <div key={i} className="relative w-3 h-3">
            <Star className="absolute w-3 h-3 text-slate-200" />
            <div className="absolute overflow-hidden w-1.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="w-3 h-3 text-slate-200" />);
      }
    }
    return stars;
  };

  const getTeamAverage = (teamPlayerIds) => {
    const total = teamPlayerIds.reduce((sum, playerId) => {
      const player = players.find((p) => p.id === playerId);
      return sum + (player?.rating || 3);
    }, 0);
    return total / teamPlayerIds.length;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 pb-8"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-center shadow-lg">
        <h2 className="text-xl font-bold text-white">עדכון תוצאות המחזור</h2>
        <p className="text-white/90 text-sm mt-1">
          עדכן כמה ניצחונות יש לכל קבוצה
        </p>
      </div>

      {/* Teams */}
      <div className="space-y-4">
        {teams.map((teamPlayerIds, teamIndex) => {
          const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
          const teamAverage = getTeamAverage(teamPlayerIds);
          const isOpening = openingTeams && openingTeams.includes(teamIndex);

          return (
            <motion.div
              key={teamIndex}
              layout
              className={`rounded-2xl ${color.bg} border-2 ${color.border} overflow-hidden`}
            >
              {/* Team Header */}
              <div className="p-4 border-b border-white/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-white/80 ${color.accent}`}>
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-lg">
                          {TEAM_NAMES[teamIndex]}
                        </h3>
                        <span className={`text-base font-semibold ${color.accent}`}>
                          ({teamAverage.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-500">
                          {teamPlayerIds.length} שחקנים
                        </p>
                        {isOpening && (
                          <span className="text-sm text-amber-600 font-medium">• ⚽ פותחת</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Win Counter */}
                  <div className="flex items-center gap-2 bg-white/80 rounded-xl p-2">
                    <button
                      onClick={() => decrementWins(teamIndex)}
                      className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <div className="flex items-center gap-1 px-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-slate-700 min-w-[20px] text-center">
                        {teamWins[teamIndex] || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => incrementWins(teamIndex)}
                      className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Players */}
              <div className="p-3 space-y-2">
                {teamPlayerIds.map((playerId) => {
                  const player = players.find((p) => p.id === playerId);
                  if (!player) return null;
                  const isGoalkeeper = goalkeepers[teamIndex] === playerId;

                  return (
                    <div
                      key={playerId}
                      className={`flex items-center gap-3 p-3 rounded-xl bg-white/80 ${
                        isGoalkeeper ? 'ring-2 ring-amber-400 shadow-sm' : ''
                      }`}
                    >
                      {/* Avatar */}
                      {player.image ? (
                        <img
                          src={player.image}
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {player.name}
                          </span>
                          {isGoalkeeper && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              שוער
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {renderStars(player.rating || 3)}
                        </div>
                      </div>

                      <span className="text-sm font-semibold text-slate-500">
                        {(player.rating || 3).toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {Object.values(teamWins).some((w) => w > 0) && (
        <div className="space-y-3 pt-4">
          {!saved && (
            <Button
              onClick={handleSave}
              variant="outline"
              className="w-full h-14 text-lg border-2 border-blue-300 bg-blue-50 hover:bg-blue-100"
            >
              <Save className="w-5 h-5 ml-2" />
              שמור
            </Button>
          )}

          <Button
            onClick={handleFinishRound}
            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-xl"
          >
            <CheckCircle className="w-6 h-6 ml-3" />
            סיום המחזור
          </Button>
        </div>
      )}
    </motion.div>
  );
}