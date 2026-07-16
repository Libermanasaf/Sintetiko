import React, { useState } from 'react';
import { Star, Pencil, Trash2, Check, X, Trophy, Users } from 'lucide-react';
import MvpBadge from '@/components/MvpBadge';
import { POSITION_STYLE } from '@/lib/positions';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function PlayerCard({ player, onUpdate, onDelete, onEdit, mvpCount, onNameClick }) {
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [tempRating, setTempRating] = useState(player.rating || 3);

  const saveRating = () => {
    onUpdate(player.id, { rating: tempRating });
    setIsEditingRating(false);
  };

  const cancelRating = () => {
    setTempRating(player.rating || 3);
    setIsEditingRating(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group relative bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-600/40 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        {/* Avatar + Name — tap to open this player's stats */}
        <button
          type="button"
          onClick={onNameClick}
          disabled={!onNameClick}
          aria-label={onNameClick ? `הצג סטטיסטיקות של ${player.name}` : undefined}
          className="flex items-center gap-4 flex-1 min-w-0 text-right disabled:cursor-default"
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            {player.image ? (
              <img src={player.image} alt={player.name} className="w-12 h-12 rounded-xl object-cover border border-slate-600 group-hover:border-emerald-600/60 transition-colors" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center border border-slate-600 group-hover:border-emerald-600/60 transition-colors">
                <span className="text-lg font-black text-slate-400">{player.name.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-lg leading-tight truncate flex items-center gap-1.5">
              <span className="truncate group-hover:text-emerald-300 transition-colors">{player.name}</span>
              <MvpBadge count={mvpCount} />
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-slate-400">{player.wins || 0} נצחונות</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-slate-400">{player.appearances || 0} הופעות</span>
              </div>
            </div>
          </div>
        </button>

        {/* Position — small select box; tap opens the options */}
        <select
          value={player.position || ''}
          onChange={(e) => onUpdate(player.id, { position: e.target.value || null })}
          aria-label={`עמדה של ${player.name}`}
          dir="rtl"
          className={`shrink-0 h-8 px-2 rounded-lg text-xs font-black ring-1 outline-none cursor-pointer appearance-none text-center ${
            POSITION_STYLE[player.position] || 'text-slate-400 ring-white/10 bg-slate-900/80'
          }`}
        >
          <option value="" className="bg-slate-900 text-slate-300">עמדה?</option>
          <option value="CB" className="bg-slate-900 text-slate-100">בלם</option>
          <option value="MC" className="bg-slate-900 text-slate-100">קשר</option>
          <option value="ST" className="bg-slate-900 text-slate-100">חלוץ</option>
        </select>

        {/* Rating */}
        <button
          onClick={() => setIsEditingRating(true)}
          className="flex flex-col items-center gap-0.5 shrink-0 hover:opacity-80 transition-opacity"
        >
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <span className="text-base font-black text-amber-400">{player.rating?.toFixed(1) || '3.0'}</span>
        </button>

        {/* Action Buttons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button size="icon" variant="ghost" onClick={() => onEdit(player)}
            className="h-8 w-8 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost"
                className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl" className="bg-slate-900 border border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">מחיקת שחקן</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  האם אתה בטוח שברצונך למחוק את {player.name}? פעולה זו לא ניתנת לביטול.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(player.id)} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Rating Editor */}
      {isEditingRating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute left-4 top-4 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-10 min-w-[200px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <Slider value={[tempRating]} onValueChange={v => setTempRating(v[0])} min={1} max={5} step={0.5} className="flex-1" />
            <span className="text-sm font-bold text-amber-400 w-8">{tempRating}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={saveRating} className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelRating} className="h-7 px-2 text-slate-400 hover:text-slate-300">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}