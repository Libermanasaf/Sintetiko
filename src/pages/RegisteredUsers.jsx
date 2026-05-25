import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { UsersRound, Mail, Clock, Search, User, ShieldCheck, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

export default function RegisteredUsers() {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState(new Set()); // Set of subscribed emails (lowercase)
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [{ data: playerData, error: playerErr }, { data: subData }] = await Promise.all([
          supabase
            .from('players')
            .select('id, name, email, created_date, is_approved')
            .not('user_id', 'is', null)
            .order('name', { ascending: true }),
          supabase
            .from('push_subscriptions')
            .select('user_email'),
        ]);

        if (playerErr) throw playerErr;
        setUsers(playerData || []);

        const subEmails = new Set(
          (subData || []).map(s => (s.user_email || '').toLowerCase()).filter(Boolean)
        );
        setSubscriptions(subEmails);
      } catch (err) {
        console.error('Error fetching registered users:', err.message);
        toast.error('שגיאה בטעינת המשתמשים', { description: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }, [users, query]);

  const approvedCount = users.filter((u) => u.is_approved).length;
  const subscribedCount = users.filter((u) => subscriptions.has((u.email || '').toLowerCase())).length;

  return (
    <div className="pb-10">
      <PageHeader
        icon={UsersRound}
        title="משתמשים רשומים"
        subtitle={users.length ? `${users.length} משתמשים · ${approvedCount} פעילים` : 'רשימת כל המשתמשים הרשומים'}
        accent="sky"
      />

      <div className="p-4 space-y-4">
        {/* Push summary */}
        {!isLoading && users.length > 0 && (
          <div className="flex gap-2.5">
            <div className="flex-1 rounded-2xl bg-emerald-900/30 ring-1 ring-emerald-500/25 p-3.5 flex items-center gap-2.5">
              <div className="grid place-items-center w-9 h-9 rounded-xl bg-emerald-500/20 shrink-0">
                <Bell className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-300 font-black text-lg tnum leading-none">{subscribedCount}</p>
                <p className="text-emerald-300/60 text-[0.65rem] font-bold mt-0.5">מקבלים התראות</p>
              </div>
            </div>
            <div className="flex-1 rounded-2xl bg-slate-800/60 ring-1 ring-white/8 p-3.5 flex items-center gap-2.5">
              <div className="grid place-items-center w-9 h-9 rounded-xl bg-slate-700/50 shrink-0">
                <BellOff className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-300 font-black text-lg tnum leading-none">{users.length - subscribedCount}</p>
                <p className="text-slate-400/70 text-[0.65rem] font-bold mt-0.5">לא מנויים</p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {!isLoading && users.length > 0 && (
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חפש לפי שם או מייל"
              className="w-full min-h-[48px] pr-10 pl-4 rounded-xl bg-slate-900/70 ring-1 ring-white/8 text-slate-200 placeholder:text-slate-500 font-medium focus:ring-amber-400/40 focus:outline-none transition-all"
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="אין משתמשים רשומים"
            hint="כשמשתמשים יירשמו וייקושרו לפרופיל בסגל, הם יופיעו כאן."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="לא נמצאו תוצאות"
            hint={`לא נמצאו משתמשים שתואמים לחיפוש "${query}".`}
          />
        ) : (
          <div className="space-y-2.5">
            {filtered.map((u, i) => {
              const isSubscribed = subscriptions.has((u.email || '').toLowerCase());
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="rounded-2xl bg-slate-900/70 ring-1 ring-white/8 p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="grid place-items-center w-11 h-11 rounded-xl st-foil text-base font-black shrink-0">
                      {(u.name?.[0] || u.email?.[0] || '?').toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2.4} />
                        <span className="font-black text-white text-sm truncate">{u.name || '—'}</span>
                        {u.is_approved ? (
                          <span className="inline-flex items-center gap-1 text-[0.6rem] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30 text-emerald-300">
                            <ShieldCheck className="w-2.5 h-2.5" strokeWidth={3} />
                            פעיל
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[0.6rem] font-black px-1.5 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-400/30 text-amber-300">
                            ממתין
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-1.5 text-xs font-medium text-ink-2">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <bdi dir="ltr" className="truncate">{u.email || '—'}</bdi>
                        </span>
                        {u.created_date && (
                          <span className="flex items-center gap-1.5 text-ink-3">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="tnum">
                              {new Date(u.created_date).toLocaleDateString('he-IL', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                              })}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Push status */}
                    <div className={`flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg text-[0.6rem] font-black ${
                      isSubscribed
                        ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-300'
                        : 'bg-slate-700/50 ring-1 ring-white/8 text-slate-500'
                    }`}>
                      {isSubscribed
                        ? <Bell className="w-3 h-3" />
                        : <BellOff className="w-3 h-3" />
                      }
                      {isSubscribed ? 'מנוי' : 'לא מנוי'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
