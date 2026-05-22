import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Calculator, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StepSettings({
  numTeams,
  setNumTeams,
  playersPerTeam,
  setPlayersPerTeam,
  onNext,
  totalPlayers,
}) {
  const requiredPlayers = numTeams * playersPerTeam;
  const hasEnoughPlayers = totalPlayers >= requiredPlayers;

  const CounterButton = ({ onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className="h-12 w-12 shrink-0 rounded-xl bg-slate-700 hover:bg-slate-600 active:bg-slate-500 border border-slate-600 text-white text-2xl font-bold flex items-center justify-center touch-manipulation transition-colors"
    >
      {children}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <div className="p-2 bg-emerald-900/50 rounded-lg">
            <Calculator className="w-5 h-5 text-emerald-400" />
          </div>
          הגדרות מחזור
        </h2>

        <div className="space-y-6">
          {/* Number of Teams */}
          <div className="space-y-3">
            <label className="text-slate-300 font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              מספר קבוצות
            </label>
            <div className="flex items-center gap-3">
              <CounterButton onClick={() => setNumTeams(Math.max(2, numTeams - 1))}>−</CounterButton>
              <div className="flex-1 h-12 bg-slate-900 border border-slate-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-black text-white">{numTeams}</span>
              </div>
              <CounterButton onClick={() => setNumTeams(numTeams + 1)}>+</CounterButton>
            </div>
          </div>

          {/* Players per Team */}
          <div className="space-y-3">
            <label className="text-slate-300 font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-400" />
              שחקנים בכל קבוצה
            </label>
            <div className="flex items-center gap-3">
              <CounterButton onClick={() => setPlayersPerTeam(Math.max(1, playersPerTeam - 1))}>−</CounterButton>
              <div className="flex-1 h-12 bg-slate-900 border border-slate-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-black text-white">{playersPerTeam}</span>
              </div>
              <CounterButton onClick={() => setPlayersPerTeam(playersPerTeam + 1)}>+</CounterButton>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className={`rounded-2xl p-5 border ${hasEnoughPlayers ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-amber-900/30 border-amber-500/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">שחקנים נדרשים</p>
            <p className="text-3xl font-bold text-white">{requiredPlayers}</p>
          </div>
          <div className="text-left">
            <p className="text-sm text-slate-400 mb-1">שחקנים בסגל</p>
            <p className={`text-3xl font-bold ${hasEnoughPlayers ? 'text-emerald-400' : 'text-amber-400'}`}>
              {totalPlayers}
            </p>
          </div>
        </div>
        {!hasEnoughPlayers && (
          <p className="mt-3 text-sm text-amber-400">
            חסרים {requiredPlayers - totalPlayers} שחקנים בסגל
          </p>
        )}
      </div>

      {/* Next Button */}
      <Button
        onClick={onNext}
        disabled={!hasEnoughPlayers}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg disabled:opacity-50"
      >
        המשך לבחירת שחקנים
        <ArrowLeft className="w-5 h-5 mr-2" />
      </Button>
    </motion.div>
  );
}
