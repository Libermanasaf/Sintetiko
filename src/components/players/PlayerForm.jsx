import React, { useState, useEffect } from 'react';
import { X, Upload, User, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= rating;
      const isHalf = i - 0.5 === rating;
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${
            isFilled || isHalf ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-auto"
            dir="rtl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {player ? 'עריכת שחקן' : 'הוספת שחקן חדש'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                          className="w-28 h-28 rounded-full object-cover ring-4 ring-emerald-100 group-hover:ring-emerald-200 transition-all"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ring-4 ring-slate-100 group-hover:ring-emerald-100 transition-all">
                          {isUploading ? (
                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <User className="w-10 h-10 text-slate-400" />
                          )}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 bg-emerald-600 text-white p-2 rounded-full shadow-lg group-hover:bg-emerald-700 transition-colors">
                        <Upload className="w-4 h-4" />
                      </div>
                    </div>
                  </label>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700">
                    שם השחקן
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="הכנס שם שחקן..."
                    className="h-12 text-lg"
                    autoFocus
                  />
                </div>

                {/* Rating Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700">דירוג</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{renderStars(rating)}</div>
                      <span className="text-lg font-semibold text-slate-700">
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
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>1.0</span>
                    <span>5.0</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
                >
                  {player ? 'שמור שינויים' : 'הוסף שחקן'}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}