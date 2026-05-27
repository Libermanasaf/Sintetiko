import React, { useState, useEffect } from 'react';
import { X, Upload, User, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { uploadFile } from '@/api/entities';

export default function PlayerForm({ isOpen, onClose, onSubmit, player }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (player) {
      setName(player.name || '');
      setRating(player.rating || 3);
      setImage(player.image || '');
    } else {
      setName('');
      setRating(3);
      setImage('');
    }
  }, [player, isOpen]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      setImage(file_url);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      rating,
      image: image || null,
    });
    onClose();
  };

  const renderStars = (r) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= r;
      const isHalf = i - 0.5 === r;
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            isFilled || isHalf ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.7)] max-h-[92vh] flex flex-col overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950"
            dir="rtl"
            style={{
              // Re-tune the shadcn primary so the Slider inside renders in gold/dark
              '--primary': '46 92% 58%',
              '--background': '215 24% 12%',
              '--ring': '46 92% 58%',
            }}
          >
            {/* Gold hairline at the top */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
                <h2 className="text-lg font-black st-gold-text">
                  {player ? 'עריכת שחקן' : 'הוספת שחקן חדש'}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="סגור"
                  className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white active:scale-95 transition-all touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
                {/* Image Upload */}
                <div className="flex justify-center">
                  <label className="cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="relative">
                      {image ? (
                        <img
                          src={image}
                          alt="Player"
                          className="w-24 h-24 rounded-full object-cover ring-4 ring-amber-500/35 group-hover:ring-amber-400/55 transition-all shadow-[0_8px_24px_-8px_rgba(251,191,36,0.4)]"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 grid place-items-center ring-4 ring-amber-500/25 group-hover:ring-amber-400/45 transition-all shadow-[0_8px_24px_-8px_rgba(251,191,36,0.25)]">
                          {isUploading ? (
                            <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <User className="w-10 h-10 text-amber-400/55" />
                          )}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 bg-emerald-500 text-white p-2 rounded-full shadow-lg ring-2 ring-slate-900 group-hover:bg-emerald-400 transition-colors">
                        <Upload className="w-4 h-4" />
                      </div>
                    </div>
                  </label>
                </div>

                {/* Name input */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-xs font-black tracking-wide text-amber-300/85">
                    שם השחקן
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="הכנס שם שחקן..."
                    className="w-full h-12 rounded-xl bg-slate-800/90 ring-1 ring-white/10 px-4 text-white text-base font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-shadow"
                    autoFocus
                  />
                </div>

                {/* Rating slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black tracking-wide text-amber-300/85">דירוג</label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{renderStars(rating)}</div>
                      <span className="tnum text-base font-black st-gold-text min-w-[2.2ch] text-center">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[rating]}
                    onValueChange={(v) => setRating(v[0])}
                    min={1}
                    max={5}
                    step={0.5}
                    className="py-2"
                  />
                  <div className="flex justify-between text-[0.65rem] font-bold tnum text-slate-500">
                    <span>1.0</span>
                    <span>5.0</span>
                  </div>
                </div>
              </div>

              {/* Sticky footer with submit button — always visible, safe-area aware */}
              <div
                className="shrink-0 border-t border-white/8 bg-slate-950/95 px-5 pt-4"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
              >
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-base shadow-[0_8px_22px_-8px_rgba(16,185,129,0.55)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-transform touch-manipulation"
                >
                  {player ? 'שמור שינויים' : 'הוסף שחקן'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
