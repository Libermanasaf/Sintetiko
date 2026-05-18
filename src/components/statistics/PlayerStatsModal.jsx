import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Trophy, Star, Zap } from 'lucide-react';

export default function PlayerStatsModal({ player, onClose, allPlayers }) {
  if (!player) return null;

  const rank = [...allPlayers].sort((a, b) => (b.appearances || 0) - (a.appearances || 0)).findIndex(p => p.id === player.id) + 1;
  const winRate = player.appearances ? ((player.wins || 0) / player.appearances * 100).toFixed(0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl"
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white">סטטיסטיקות שחקן</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {player.image ? (
            <img src={player.image} alt={player.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center ring-2 ring-slate-600">
              <User className="w-7 h-7 text-slate-400" />
            </div>
          )}
          <div>
            <p className="text-xl font-black text-white">{player.name}</p>
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(player.rating || 3) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
              ))}
              <span className="text-sm text-slate-400 mr-1">{(player.rating || 3).toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-amber-400">{player.wins || 0}</p>
            <p className="text-xs text-slate-400">גביעים</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
            <User className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-blue-400">{player.appearances || 0}</p>
            <p className="text-xs text-slate-400">הופעות</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
            <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-emerald-400">{winRate}%</p>
            <p className="text-xs text-slate-400">אחוז ניצחון</p>
          </div>
          <div className="bg-slate-700/50 border border-slate-600/40 rounded-2xl p-4 text-center">
            <Star className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-slate-300">#{rank}</p>
            <p className="text-xs text-slate-400">דירוג הופעות</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
