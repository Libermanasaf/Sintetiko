import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { UsersRound, Mail, Clock, Search, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

export default function RegisteredUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        if (!supabase) {
          const players = JSON.parse(localStorage.getItem('sintetiko_Player') || '[]');
          const registered = players.filter((p) => p.email && p.user_id);
          setUsers(registered);
          return;
        }

        const { data, error } = await supabase
          .from('players')
          .select('id, name, email, created_date, is_approved')
          .not('user_id', 'is', null)
          .order('name', { ascending: true });

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching registered users:', err.message);
        toast.error('שגיאה בטעינת המשתמשים', { description: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
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

  return (
    <div className="pb-10">
      <PageHeader
        icon={UsersRound}
        title="משתמשים רשומים"
        subtitle={users.length ? `${users.length} משתמשים במערכת · ${approvedCount} פעילים` : 'רשימת כל המשתמשים הרשומים'}
        accent="sky"
      />

      <div className="p-4 space-y-4">
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
            {filtered.map((u, i) => (
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
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
