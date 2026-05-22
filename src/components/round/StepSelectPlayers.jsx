import React from 'react';
import { motion } from 'framer-motion';
import { User, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StepSelectPlayers({ players, selectedPlayers, setSelectedPlayers, requiredPlayers, onNext, onBack }) {
  const togglePlayer = (playerId) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const isReady = selectedPlayers.length === requiredPlayers;
  const isOver = selectedPlayers.length > requiredPlayers;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      {/* Counter */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-2xl px-4 py-3 border border-slate-700/50">
        <span className="text-slate-300 font-medium text-sm">שחקנים שנבחרו</span>
        <span className={`text-lg font-black ${isReady ? 'text-emerald-400' : isOver ? 'text-red-400' : 'text-white'}`}>
          {selectedPlayers.length} / {requiredPlayers}
        </span>
      </div>

      {/* Players list */}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {players.map(player => {
          const isSelected = selectedPlayers.includes(player.id);
          return (
            <motion.div
              key={player.id}
              layout
              onClick={() => togglePlayer(player.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all touch-manipulation ${
                isSelected
                  ? 'bg-emerald-900/40 border-emerald-400/60 shadow-sm shadow-emerald-900/20'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Avatar */}
              {player.image ? (
                <img src={player.image} alt={player.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
              )}

              {/* Name + rating */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isSelected ? 'text-emerald-300' : 'text-white'}`}>{player.name}</p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.floor(player.rating || 3) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                  ))}
                  <span className="text-xs text-slate-500 mr-1">{(player.rating || 3).toFixed(1)}</span>
                </div>
              </div>

              {/* Checkmark */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                {isSelected && <span className="text-white text-xs font-bold">✓</span>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="h-12 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <Button
          onClick={onNext}
          disabled={!isReady}
          className="flex-1 h-12 text-base font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-xl disabled:opacity-50"
        >
          המשך לחלוקה לקבוצות
          <ChevronLeft className="w-5 h-5 mr-2" />
        </Button>
      </div>
    </motion.div>
  );
}
