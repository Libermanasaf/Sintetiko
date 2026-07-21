import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, User, Check } from 'lucide-react';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const STORAGE_KEY = 'sintetiko_lists_v3';

const DAY_CONFIG = {
  sunday:    { label: 'יום ראשון',  color: 'text-amber-300',   ring: 'ring-amber-400/30',   bg: 'bg-amber-500/10',   dot: 'bg-amber-400' },
  wednesday: { label: 'יום רביעי',  color: 'text-blue-300',    ring: 'ring-blue-400/30',    bg: 'bg-blue-500/10',    dot: 'bg-blue-400' },
  thursday:  { label: 'יום חמישי',  color: 'text-emerald-300', ring: 'ring-emerald-400/30', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  // One-off extra game day (Tuesday 21.7) — same violet as the Lists column.
  tuesday:   { label: 'יום שלישי',  color: 'text-violet-300',  ring: 'ring-violet-400/30',  bg: 'bg-violet-500/10',  dot: 'bg-violet-400' },
};

const EMPTY_ROWS = Array(18).fill('');

function loadDay(day) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.rows && p.headers) {
        return {
          header: p.headers[day] || DAY_CONFIG[day].label,
          rows: p.rows[day] || EMPTY_ROWS,
        };
      }
    }
  } catch {}
  return {
    header: DAY_CONFIG[day].label,
    rows: EMPTY_ROWS,
  };
}

export default function DayListView({ day }) {
  const cfg = DAY_CONFIG[day];
  const { role, loginMode, user, isRestricted } = useAuth();
  const isAdmin = role === 'admin' && loginMode !== 'player';
  const myEmail = (user?.email || '').toLowerCase();

  // Restricted player: needs own name to verify they appear in the published
  // roster (shared my-player cache — usually already fetched by PlayerHome).
  const { data: myPlayer, isFetched: myPlayerFetched } = useQuery({
    queryKey: ['my-player', user?.id, user?.email],
    queryFn: async () => {
      if (!supabase || !user) return null;
      const { data } = await supabase
        .from('players').select('*').eq('user_id', user.id).maybeSingle();
      return data;
    },
    enabled: !isAdmin && isRestricted && !!user,
  });
  const [waitingSignups, setWaitingSignups] = useState([]);
  const [loadingSignups, setLoadingSignups] = useState(true);
  const [viewers, setViewers] = useState(new Set()); // normalized names that viewed (admin)

  // Cloud-first: fetch the cross-device synced list from Supabase.
  // localStorage stays a fallback for offline / first paint before cloud arrives.
  //
  // Visibility rule: a regular player only sees a day's roster once the admin
  // PUBLISHES it (by sending a push for that day) — they read the snapshot in
  // publishedLists[day], never the live roster. The admin always sees the live
  // roster so they can edit and preview what will be published.
  const { data: cloudList, isLoading: cloudLoading } = useQuery({
    queryKey: ['lists-state', day, isAdmin, myEmail],
    queryFn: async () => {
      if (!supabase) return null;
      // Server-gated: the RPC returns the full blob to admins but ONLY the
      // published snapshot to players (live `rows` never leave the server).
      const { data, error } = await supabase.rpc('get_lists_state');
      if (error || !data) return null;
      const all = data;

      // Admin: live roster (what they're editing / will publish).
      if (isAdmin) {
        const rows = all.rows?.[day];
        const header = all.headers?.[day];
        if (!rows && !header) return null;
        return { header: header || DAY_CONFIG[day].label, rows: rows || EMPTY_ROWS };
      }

      // Player: only the published snapshot. Absent → not published yet.
      const pub = all.publishedLists?.[day];
      if (!pub || !Array.isArray(pub.rows)) return { notPublished: true };

      // Personalized: if THIS player was confirmed from stand-by after publish,
      // append their name to the roster they see (others don't see it). Slot it
      // into the first empty row, else push to the end. Skip if already present.
      let rows = pub.rows;
      const mine = myEmail
        ? (pub.extraConfirmed || []).find(e => (e.email || '').toLowerCase() === myEmail)
        : null;
      if (mine?.name && !rows.some(n => (n || '').trim() === mine.name.trim())) {
        rows = [...rows];
        const emptyIdx = rows.findIndex(r => !r || !r.trim());
        if (emptyIdx >= 0) rows[emptyIdx] = mine.name;
        else rows.push(mine.name);
      }
      return { header: pub.header || DAY_CONFIG[day].label, rows };
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  // Players must NEVER fall back to the local (live) list — that would leak an
  // unpublished roster. Only the admin gets the localStorage fallback.
  const localList = isAdmin ? loadDay(day) : null;
  const listData = cloudList || localList;
  // "Not published" only once the cloud query has resolved — avoid flashing it
  // while the snapshot is still loading for a player.
  const notPublished = !isAdmin && !cloudLoading && (cloudList?.notPublished || cloudList == null);

  useEffect(() => {
    // Players don't see the waiting list, so skip the fetch for them.
    if (!isAdmin) { setLoadingSignups(false); return; }
    if (!supabase) { setLoadingSignups(false); return; }
    supabase
      .from('signups')
      .select('id, player_name, created_date')
      .eq('day', day)
      .eq('status', 'waiting')
      .order('created_date', { ascending: true })
      .then(({ data }) => {
        setWaitingSignups(data || []);
        setLoadingSignups(false);
      });
  }, [day, isAdmin]);

  // Record that THIS player has seen the published list (once they're actually
  // viewing a published roster — not admins, not the "not published" state). The
  // RPC is idempotent (one row per user/day) so re-opening doesn't pile up rows.
  useEffect(() => {
    if (!supabase || isAdmin) return;
    if (!user || notPublished || !cloudList || cloudList.notPublished) return;
    supabase.rpc('record_list_view', { p_day: day }).then(({ error }) => {
      if (error) console.warn('[list view]', error.message);
    });
  }, [day, isAdmin, user, notPublished, cloudList]);

  // Admin: load who has viewed this day's list (since last publish) and refresh
  // periodically so the ✓ marks appear as players open it. Names are normalized
  // (trim) for matching against the roster text.
  useEffect(() => {
    if (!supabase || !isAdmin) return;
    let cancelled = false;
    const load = () => {
      supabase.rpc('list_viewers', { p_day: day }).then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setViewers(new Set(data.map((v) => (v.name || '').trim()).filter(Boolean)));
      });
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [day, isAdmin]);

  // Restricted player: the roster is visible ONLY if the admin approved them
  // into it (their name in the published rows / extraConfirmed). Direct-URL
  // defense — the sidebar already hides unapproved days.
  const restrictedBlocked = (() => {
    if (isAdmin || !isRestricted) return false;
    if (cloudLoading || !myPlayerFetched) return false;      // still deciding
    if (!listData || notPublished) return false;             // normal empty state covers it
    const myName = (myPlayer?.name || '').trim();
    return !(myName && listData.rows.some((n) => (n || '').trim() === myName));
  })();

  if (restrictedBlocked) {
    return (
      <div className="pb-10">
        <PageHeader icon={ClipboardList} title={cfg.label} subtitle="רשימה"
          accent={day === 'sunday' ? 'amber' : day === 'wednesday' ? 'sky' : day === 'tuesday' ? 'violet' : 'emerald'} />
        <div className="p-4">
          <div className="rounded-2xl bg-slate-900/50 ring-1 ring-white/8 px-6 py-12 text-center">
            <div className={`mx-auto mb-4 grid place-items-center w-14 h-14 rounded-2xl ${cfg.bg} ring-1 ${cfg.ring}`}>
              <Clock className={`w-7 h-7 ${cfg.color}`} strokeWidth={2} />
            </div>
            <p className="text-white font-black text-lg">הרשימה אינה זמינה עבורך</p>
            <p className="text-slate-400 text-sm font-bold mt-2 leading-relaxed">
              אם תאושר לרשימת {cfg.label} — היא תופיע כאן.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Player hasn't been shown a published list yet (or it's still loading from
  // cloud). Show a clear "not published" state instead of leaking/empty-crashing.
  if (notPublished || !listData) {
    return (
      <div className="pb-10">
        <PageHeader
          icon={ClipboardList}
          title={cfg.label}
          subtitle="רשימה"
          accent={day === 'sunday' ? 'amber' : day === 'wednesday' ? 'sky' : day === 'tuesday' ? 'violet' : 'emerald'}
        />
        <div className="p-4">
          <div className="rounded-2xl bg-slate-900/50 ring-1 ring-white/8 px-6 py-12 text-center">
            <div className={`mx-auto mb-4 grid place-items-center w-14 h-14 rounded-2xl ${cfg.bg} ring-1 ${cfg.ring}`}>
              <Clock className={`w-7 h-7 ${cfg.color}`} strokeWidth={2} />
            </div>
            <p className="text-white font-black text-lg">הרשימה ל{cfg.label} טרם פורסמה</p>
            <p className="text-slate-400 text-sm font-bold mt-2 leading-relaxed">
              ברגע שהרשימה תפורסם תקבל התראה, והיא תופיע כאן.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filledRows = listData.rows.filter(n => n.trim());
  const emptyCount = listData.rows.filter(n => !n.trim()).length;

  return (
    <div className="pb-10">
      <PageHeader
        icon={ClipboardList}
        title={listData.header}
        subtitle={`${filledRows.length} שחקנים ברשימה`}
        accent={day === 'sunday' ? 'amber' : day === 'wednesday' ? 'sky' : day === 'tuesday' ? 'violet' : 'emerald'}
      />

      <div className="p-4 space-y-4">
        {/* Roster */}
        <div className={`rounded-2xl ring-1 ${cfg.ring} overflow-hidden`}>
          <div className={`${cfg.bg} px-4 py-3 flex items-center gap-2`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`font-black text-sm ${cfg.color}`}>רשימה ראשית</span>
            {isAdmin && viewers.size > 0 && (
              <span className="flex items-center gap-1 text-emerald-400 text-[0.65rem] font-black">
                <Check className="w-3 h-3" strokeWidth={3} />
                {filledRows.filter(n => viewers.has(n.trim())).length} ראו
              </span>
            )}
            <span className="text-slate-400 text-xs font-bold mr-auto">{filledRows.length} / {listData.rows.length}</span>
          </div>
          <div className="divide-y divide-white/5">
            {listData.rows.map((name, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(idx * 0.015, 0.25) }}
                className={`flex items-center gap-3 px-4 py-3 ${!name.trim() ? 'opacity-30' : ''}`}
              >
                <span className={`text-xs font-black tnum w-6 text-center shrink-0 ${name.trim() ? cfg.color : 'text-slate-600'}`}>
                  {idx + 1}
                </span>
                {name.trim() ? (
                  <>
                    <div className={`grid place-items-center w-7 h-7 rounded-lg ${cfg.bg} ring-1 ${cfg.ring} shrink-0`}>
                      <User className={`w-3.5 h-3.5 ${cfg.color}`} strokeWidth={2.4} />
                    </div>
                    <span className="text-white font-bold text-sm">{name}</span>
                    {/* Admin: ✓ if this player has opened the published list */}
                    {isAdmin && viewers.has(name.trim()) && (
                      <span className="mr-auto flex items-center gap-1 text-emerald-400 shrink-0" title="ראה את הרשימה">
                        <Check className="w-4 h-4" strokeWidth={3} />
                        <span className="text-[0.6rem] font-black hidden xs:inline">ראה</span>
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-600 text-sm font-medium">— מקום פנוי —</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Waiting list — admin only (players don't see this section) */}
        {isAdmin && (
        <div className="rounded-2xl ring-1 ring-white/8 overflow-hidden bg-slate-900/50">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-black text-sm text-slate-300">ממתינים</span>
            {!loadingSignups && (
              <span className="text-slate-500 text-xs font-bold mr-auto">{waitingSignups.length} ממתינים</span>
            )}
          </div>
          {loadingSignups ? (
            <div className="p-4 space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
          ) : waitingSignups.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-sm font-medium">אין ממתינים כרגע</div>
          ) : (
            <div className="divide-y divide-white/5">
              {waitingSignups.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-black tnum w-6 text-center text-slate-500 shrink-0">{idx + 1}</span>
                  <div className="grid place-items-center w-7 h-7 rounded-lg bg-slate-800 ring-1 ring-white/8 shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.4} />
                  </div>
                  <span className="text-slate-300 font-bold text-sm">{s.player_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
