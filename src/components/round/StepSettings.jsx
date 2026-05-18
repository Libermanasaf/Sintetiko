import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Calculator, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Calculator className="w-5 h-5 text-emerald-600" />
          </div>
          הגדרות מחזור
        </h2>

        <div className="space-y-6">
          {/* Number of Teams */}
          <div className="space-y-3">
            <Label className="text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              מספר קבוצות
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setNumTeams(Math.max(2, numTeams - 1))}
                className="h-12 w-12 shrink-0"
              >
                -
              </Button>
              <Input
                type="number"
                value={numTeams}
                onChange={(e) => setNumTeams(Math.max(2, parseInt(e.target.value) || 2))}
                className="h-12 text-center text-xl font-bold"
                min={2}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setNumTeams(numTeams + 1)}
                className="h-12 w-12 shrink-0"
              >
                +
              </Button>
            </div>
          </div>

          {/* Players per Team */}
          <div className="space-y-3">
            <Label className="text-slate-700 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              שחקנים בכל קבוצה
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPlayersPerTeam(Math.max(1, playersPerTeam - 1))}
                className="h-12 w-12 shrink-0"
              >
                -
              </Button>
              <Input
                type="number"
                value={playersPerTeam}
                onChange={(e) => setPlayersPerTeam(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-12 text-center text-xl font-bold"
                min={1}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPlayersPerTeam(playersPerTeam + 1)}
                className="h-12 w-12 shrink-0"
              >
                +
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className={`rounded-2xl p-5 ${hasEnoughPlayers ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">שחקנים נדרשים</p>
            <p className="text-3xl font-bold text-slate-800">{requiredPlayers}</p>
          </div>
          <div className="text-left">
            <p className="text-sm text-slate-500 mb-1">שחקנים בסגל</p>
            <p className={`text-3xl font-bold ${hasEnoughPlayers ? 'text-emerald-600' : 'text-amber-600'}`}>
              {totalPlayers}
            </p>
          </div>
        </div>
        {!hasEnoughPlayers && (
          <p className="mt-3 text-sm text-amber-700">
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