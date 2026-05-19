import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Users, Mail, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function UserApprovals() {
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null); // id of player currently being updated
  const { toast } = useToast();

  const fetchPendingPlayers = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        // Fallback for simulation
        const mockPending = [
          { id: '1', name: 'ישראל ישראלי', email: 'israel@example.com', created_date: new Date().toISOString() },
          { id: '2', name: 'אבי כהן', email: 'avi.cohen@example.com', created_date: new Date().toISOString() }
        ];
        setPendingPlayers(mockPending);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('is_approved', false)
        .order('created_date', { ascending: false });

      if (error) throw error;
      setPendingPlayers(data || []);
    } catch (err) {
      console.error('Error fetching pending players:', err.message);
      toast({
        variant: "destructive",
        title: "שגיאה בטעינת המשתמשים",
        description: err.message,
      });
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
      }

      toast({
        title: "השחקן אושר בהצלחה",
        description: `חשבונו של ${name} הופעל והוא יכול כעת להתחבר.`,
      });

      setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "שגיאה באישור השחקן",
        description: err.message,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (playerId, name) => {
    if (!window.confirm(`האם אתה בטוח שברצונך לדחות ולמחוק את בקשת ההרשמה של ${name}?`)) {
      return;
    }
    setActionInProgress(playerId);
    try {
      if (supabase) {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', playerId);

        if (error) throw error;
      }

      toast({
        title: "בקשת ההרשמה נדחתה ומקבל הבקשה נמחק",
        description: `בקשתו של ${name} הוסרה מהמערכת.`,
      });

      setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "שגיאה בדחיית הבקשה",
        description: err.message,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-32" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">אישור משתמשים חדשים</h1>
          <p className="text-slate-500 dark:text-slate-400">נהל ואשר בקשות הרשמה לסגל הקבוצה</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500">טוען בקשות אישור...</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {pendingPlayers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-10 text-center shadow-lg"
            >
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-850 dark:text-white mb-1">אין בקשות אישור ממתינות</h3>
              <p className="text-slate-500 max-w-sm mx-auto text-sm">כל המשתמשים הנרשמים במערכת מאושרים ופעילים כרגע.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {pendingPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-md hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="text-xl">⚽</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                        {player.name}
                        {player.email === 'libermanasaf@gmail.com' && (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">יו"ר</span>
                        )}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="font-mono">{player.email}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>נרשם ב: {new Date(player.created_date).toLocaleDateString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end border-t border-slate-50 dark:border-slate-800/50 pt-3 md:pt-0 md:border-0">
                    <button
                      onClick={() => handleReject(player.id, player.name)}
                      disabled={actionInProgress === player.id}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 dark:border-rose-950/30 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold text-sm transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>דחייה</span>
                    </button>
                    <button
                      onClick={() => handleApprove(player.id, player.name)}
                      disabled={actionInProgress === player.id}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-[0_4px_12px_rgba(16,185,129,0.15)] disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>אישור כניסה</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
