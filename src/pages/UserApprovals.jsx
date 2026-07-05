import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, UserCheck, Mail, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

export default function UserApprovals() {
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchPendingPlayers = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        try {
          const playersKey = 'sintetiko_Player';
          const players = JSON.parse(localStorage.getItem(playersKey) || '[]');
          const pending = players.filter(p => p.email && p.is_approved === false);
          setPendingPlayers(pending);
        } catch (err) {
          console.error('Error fetching pending players from local storage:', err);
        }
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('is_approved', false)
        .not('user_id', 'is', null)
        .order('name', { ascending: true });

      if (error) throw error;
      setPendingPlayers(data || []);
    } catch (err) {
      console.error('Error fetching pending players:', err.message);
      toast.error('שגיאה בטעינת המשתמשים', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPlayers();
  }, []);

  const handleApprove = async (playerId, name) => {
    setActionInProgress(playerId);
    try {
      if (supabase) {
        const { error } = await supabase
          .from('players')
          .update({ is_approved: true })
          .eq('id', playerId);
        if (error) throw error;
      } else {
        const playersKey = 'sintetiko_Player';
        const players = JSON.parse(localStorage.getItem(playersKey) || '[]');
        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
          players[index].is_approved = true;
          localStorage.setItem(playersKey, JSON.stringify(players));
        }
      }
      toast.success('השחקן אושר בהצלחה', { description: `חשבונו של ${name} הופעל והוא יכול כעת להתחבר.` });
      setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
    } catch (err) {
      toast.error('שגיאה באישור השחקן', { description: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (playerId, name) => {
    if (!window.confirm(`האם אתה בטוח שברצונך לדחות ולבטל את בקשת ההרשמה של ${name}?`)) {
      return;
    }
    setActionInProgress(playerId);
    try {
      if (supabase) {
        const { error } = await supabase
          .from('players')
          .update({ user_id: null, email: null, is_approved: false })
          .eq('id', playerId);
        if (error) throw error;
      } else {
        const playersKey = 'sintetiko_Player';
        const players = JSON.parse(localStorage.getItem(playersKey) || '[]');
        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
          players[index].email = null;
          players[index].user_id = null;
          players[index].is_approved = false;
          localStorage.setItem(playersKey, JSON.stringify(players));
        }
      }
      toast.success('בקשת ההרשמה נדחתה', { description: `בקשתו של ${name} הוסרה והפרופיל שלו חזר להיות פנוי בסגל.` });
      setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
    } catch (err) {
      toast.error('שגיאה בדחיית הבקשה', { description: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="pb-10">
      <PageHeader
        icon={UserCheck}
        title="אישור משתמשים"
        subtitle={pendingPlayers.length ? `${pendingPlayers.length} בקשות ממתינות` : 'בקשות הרשמה לסגל'}
        accent="sky"
      />

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {pendingPlayers.length === 0 ? (
              <EmptyState
                key="empty"
                icon={UserCheck}
                title="אין בקשות ממתינות"
                hint="כל המשתמשים הרשומים במערכת מאושרים ופעילים."
              />
            ) : (
              <div className="space-y-3">
                {pendingPlayers.map((player) => {
                  const busy = actionInProgress === player.id;
                  return (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-2xl bg-slate-900/70 ring-1 ring-white/8 overflow-hidden"
                    >
                      {/* Squad name banner */}
                      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/8 border-b border-amber-500/15">
                        <User className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2.4} />
                        <span className="text-[0.72rem] font-bold text-ink-3">שם שנבחר מהסגל:</span>
                        <span className="font-black text-amber-200 text-sm truncate">{player.name}</span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="grid place-items-center w-11 h-11 rounded-xl st-foil text-base font-black shrink-0">
                            {(player.name?.[0] || '?').toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1.5 text-xs font-medium text-ink-2">
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <bdi dir="ltr" className="truncate">{player.email}</bdi>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="tnum">
                                  נרשם: {new Date(player.created_date).toLocaleDateString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2.5 mt-4">
                          <button
                            onClick={() => handleReject(player.id, player.name)}
                            disabled={busy}
                            className="flex items-center justify-center gap-1.5 min-h-[48px] px-4 rounded-xl ring-1 ring-rose-500/30 bg-rose-500/10 text-rose-300 font-black text-sm active:scale-95 transition-transform disabled:opacity-50"
                          >
                            <X className="w-4 h-4" strokeWidth={2.8} />
                            דחייה
                          </button>
                          <button
                            onClick={() => handleApprove(player.id, player.name)}
                            disabled={busy}
                            className="flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-700 text-white font-black text-sm shadow-[0_8px_20px_-8px_rgba(16,185,129,0.6)] active:scale-[0.98] transition-transform disabled:opacity-50"
                          >
                            {busy ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" strokeWidth={2.8} />
                            )}
                            אישור כניסה
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
