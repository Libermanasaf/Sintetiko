import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Round, Player, uploadFile } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trophy, User, Star, Shield, Plus, Minus, Save, ArrowLeftRight, Camera, Upload, X, CalendarDays, Target } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import TeamPlayerMover from '@/components/history/TeamPlayerMover';
import { PageHeader, SectionTitle, EmptyState, Skeleton } from '@/components/ui/lux';
import { useAuth } from '@/lib/AuthContext';

const TEAM_COLORS = [
  { name: 'הצהובים', text: 'text-yellow-300' },
  { name: 'הכחולים', text: 'text-blue-300' },
  { name: 'הכתומים', text: 'text-orange-300' },
];

function buildSummary(round, players, tempWins) {
  const NAMES = ['הצהובים', 'הכחולים', 'הכתומים'];

  const dateStr = new Date(round.date).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const winsArr = (round.teams || []).map((_, i) => tempWins[i] || 0);
  const maxWins = Math.max(...winsArr, 0);
  const winnerIdxs = winsArr.map((w, i) => ({ w, i })).filter(x => x.w === maxWins && x.w > 0);

  const scorers = Object.entries(round.player_goals || {})
    .filter(([, g]) => g > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([pid, goals]) => ({ name: players.find(p => p.id === pid)?.name || 'שחקן', goals }));

  const totalGoals = scorers.reduce((s, x) => s + x.goals, 0);

  const teamResults = winsArr.map((w, i) =>
    `${NAMES[i] || `קבוצה ${i + 1}`} — ${w} ${w === 1 ? 'ניצחון' : 'ניצחונות'}`
  ).join(', ');

  let text = `מחזור ${dateStr}. ${teamResults}. `;

  if (winnerIdxs.length === 1) {
    text += `${NAMES[winnerIdxs[0].i]} סיימו את הערב כמנצחות עם ${winnerIdxs[0].w} ניצחונות. `;
  } else if (winnerIdxs.length > 1) {
    text += `הערב הסתיים בתיקו בין ${winnerIdxs.map(x => NAMES[x.i]).join(' ל')}. `;
  } else {
    text += 'לא נרשמו ניצחונות הערב. ';
  }

  if (scorers.length === 0) {
    text += 'לא נרשמו גולים במהלך הערב.';
  } else {
    text += `סה"כ ${totalGoals} ${totalGoals === 1 ? 'גול' : 'גולים'} הערב. `;
    const top = scorers[0];
    if (scorers.length === 1) {
      text += `${top.name} היה הכובש היחיד עם ${top.goals} ${top.goals === 1 ? 'גול' : 'גולים'}.`;
    } else {
      text += `בולט הערב: ${top.name} עם ${top.goals} ${top.goals === 1 ? 'גול' : 'גולים'}`;
      const rest = scorers.slice(1).map(s => `${s.name} (${s.goals})`).join(', ');
      text += `. כובשים נוספים: ${rest}.`;
    }
  }

  return text;
}

function GoalEditorSheet({ open, player, teamIndex, currentGoals, onClose, onChange, saving }) {
  if (typeof document === 'undefined') return null;
  const t = teamIndex != null ? TEAM_COLORS[teamIndex % 3] : null;
  return createPortal(
    <AnimatePresence>
      {open && player && (
        <motion.div
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="w-full sm:max-w-sm sm:w-[calc(100vw-32px)]"
            onClick={e => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label="עריכת גולים"
          >
            <div className="relative rounded-t-3xl sm:rounded-3xl p-px bg-gradient-to-br from-amber-400/60 via-slate-700/30 to-slate-800/10">
              <div className="rounded-t-[23px] sm:rounded-[23px] bg-gradient-to-b from-slate-900 to-slate-950 p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {player.image ? (
                      <img src={player.image} alt={player.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
                    ) : (
                      <div className="grid place-items-center w-10 h-10 rounded-full bg-slate-700 shrink-0">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-black text-base truncate">{player.name}</p>
                      {t && <p className={`text-xs font-bold ${t.text}`}>{t.name}</p>}
                    </div>
                  </div>
                  <button onClick={onClose} aria-label="סגור" className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800/80 text-slate-400 active:scale-95 transition-transform shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="st-rule my-4" />
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => onChange(Math.max(0, currentGoals - 1))}
                    disabled={saving || currentGoals === 0}
                    aria-label="הפחת גול"
                    className="grid place-items-center w-16 h-16 rounded-2xl bg-rose-500/15 ring-1 ring-rose-500/30 text-rose-300 active:scale-95 disabled:opacity-40 transition-transform touch-manipulation"
                  >
                    <Minus className="w-7 h-7" strokeWidth={3} />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Target className="w-5 h-5 text-amber-400" strokeWidth={2.4} />
                      <span className="text-amber-300 text-xs font-black tracking-wide">גולים</span>
                    </div>
                    <motion.p
                      key={currentGoals}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 320 }}
                      className="st-gold-text font-black text-6xl tnum leading-none mt-1"
                    >
                      {currentGoals}
                    </motion.p>
                  </div>
                  <button
                    onClick={() => onChange(currentGoals + 1)}
                    disabled={saving}
                    aria-label="הוסף גול"
                    className="grid place-items-center w-16 h-16 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-300 active:scale-95 disabled:opacity-50 transition-transform touch-manipulation"
                  >
                    <Plus className="w-7 h-7" strokeWidth={3} />
                  </button>
                </div>
                <p className="text-center text-ink-3 text-[0.65rem] font-bold mt-4">
                  {saving ? 'שומר...' : 'השינויים נשמרים אוטומטית'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const TEAM = [
  { name: 'הצהובים', dot: 'bg-yellow-400', header: 'from-yellow-500/20 to-yellow-600/5', ring: 'ring-yellow-500/35', text: 'text-yellow-300' },
  { name: 'הכחולים', dot: 'bg-blue-400',  header: 'from-blue-500/20 to-blue-600/5',   ring: 'ring-blue-500/35',   text: 'text-blue-300' },
  { name: 'הכתומים', dot: 'bg-orange-400', header: 'from-orange-500/20 to-orange-600/5', ring: 'ring-orange-500/35', text: 'text-orange-300' },
];
const teamOf = (i) => TEAM[i % 3];

export default function GameHistory() {
  const { loginMode, role } = useAuth();
  const isAdmin = loginMode ? loginMode === 'admin' : role === 'admin';
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingRound, setEditingRound] = useState(null);
  const [tempWins, setTempWins] = useState({});
  const [showMover, setShowMover] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null); // { player, teamIndex }
  const [savingGoals, setSavingGoals] = useState(false);
  const [resultsSummary, setResultsSummary] = useState(null);
  const queryClient = useQueryClient();

  const { data: rounds = [], isLoading } = useQuery({
    queryKey: ['rounds', isAdmin],
    queryFn: async () => {
      const all = await Round.list('-created_date');
      if (isAdmin) return all;
      return all.filter(r => {
        // Round with a declared winner → always visible
        if (r.winningTeam != null) return true;
        // Old round (>3 days) → backward compatible, always visible
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 3);
        if (new Date(r.date) < cutoff) return true;
        // Recent active round → only after admin publishes
        return r.is_published === true;
      });
    },
  });
  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
  });

  const updateRoundMutation = useMutation({
    mutationFn: ({ roundId, teamWins, winningTeam }) =>
      Round.update(roundId, { teamWins, winningTeam }),
    onSuccess: (_, { teamWins }) => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
      toast.success('התוצאות עודכנו בהצלחה');
      if (selectedRound) {
        setResultsSummary(buildSummary(selectedRound, players, teamWins));
      }
      setEditingRound(null);
    },
  });

  const updatePlayersMutation = useMutation({
    mutationFn: (updates) =>
      Promise.all(updates.map(({ playerId, wins }) => Player.update(playerId, { wins }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const updateTeamsMutation = useMutation({
    mutationFn: ({ roundId, teams }) => Round.update(roundId, { teams }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
      toast.success('סידור הקבוצות עודכן בהצלחה');
      setShowMover(false);
    },
  });

  const selectedRound = selectedDate
    ? rounds.find(round => isSameDay(new Date(round.date), selectedDate))
    : null;

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setEditingPlayer(null);
    setEditingRound(null);
    setResultsSummary(null);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRound) return;
    setUploadingPhoto(true);
    const { file_url } = await uploadFile(file);
    await Round.update(selectedRound.id, { victoryPhoto: file_url });
    queryClient.invalidateQueries({ queryKey: ['rounds'] });
    toast.success('תמונת הניצחון נשמרה!');
    setUploadingPhoto(false);
  };

  const removePhoto = async () => {
    if (!selectedRound) return;
    await Round.update(selectedRound.id, { victoryPhoto: null });
    queryClient.invalidateQueries({ queryKey: ['rounds'] });
    toast.success('התמונה הוסרה');
  };

  const datesWithGames = rounds.map(round => new Date(round.date));

  const startEditing = (round) => {
    setEditingRound(round.id);
    setTempWins(round.teamWins || {});
  };

  const updateWins = (teamIndex, delta) => {
    setTempWins(prev => ({
      ...prev,
      [teamIndex]: Math.max(0, (prev[teamIndex] || 0) + delta),
    }));
  };

  const saveResults = async () => {
    if (!selectedRound) return;
    const winsValues = Object.values(tempWins);
    const maxWins = winsValues.length ? Math.max(...winsValues) : 0;
    const teamsWithMax = (selectedRound.teams || [])
      .map((_, i) => i)
      .filter(i => (tempWins[i] || 0) === maxWins);
    const winningTeam = (maxWins > 0 && teamsWithMax.length === 1) ? teamsWithMax[0] : null;

    const playerDelta = {};
    const prevWinningTeam = selectedRound.winningTeam;
    if (prevWinningTeam !== undefined && prevWinningTeam !== null) {
      (selectedRound.teams[prevWinningTeam] || []).forEach(pid => {
        playerDelta[pid] = (playerDelta[pid] || 0) - 1;
      });
    }
    if (winningTeam !== null) {
      (selectedRound.teams[winningTeam] || []).forEach(pid => {
        playerDelta[pid] = (playerDelta[pid] || 0) + 1;
      });
    }

    const playerUpdates = Object.entries(playerDelta)
      .filter(([, delta]) => delta !== 0)
      .map(([playerId, delta]) => {
        const player = players.find(p => p.id === playerId);
        return { playerId, wins: Math.max(0, (player?.wins || 0) + delta) };
      });

    await updateRoundMutation.mutateAsync({ roundId: selectedRound.id, teamWins: tempWins, winningTeam });
    if (playerUpdates.length) {
      await updatePlayersMutation.mutateAsync(playerUpdates);
    }
  };

  const handleGoalChange = async (newCount) => {
    if (!selectedRound || !editingPlayer) return;
    const pid = editingPlayer.player.id;
    const nextGoals = { ...(selectedRound.player_goals || {}), [pid]: newCount };
    setSavingGoals(true);
    try {
      await Round.update(selectedRound.id, { player_goals: nextGoals });
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    } catch {
      toast.error('שגיאה בשמירת הגולים');
    }
    setSavingGoals(false);
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
    ));

  const getTeamAverage = (teamPlayerIds) => {
    const sum = teamPlayerIds.reduce((s, id) => s + (players.find(p => p.id === id)?.rating || 3), 0);
    return (sum / teamPlayerIds.length).toFixed(1);
  };

  return (
    <div className="pb-10">
      <PageHeader
        icon={History}
        title="היסטוריית משחקים"
        subtitle={rounds.length ? `${rounds.length} מחזורים` : 'יומן המשחקים'}
        accent="emerald"
      />

      <div className="p-4 space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </>
        ) : rounds.length === 0 ? (
          <EmptyState
            icon={History}
            title="אין עדיין משחקים"
            hint="המחזורים שתשחקו יופיעו כאן ביומן."
          />
        ) : (
          <>
            {/* Calendar — centered card, natural calendar width */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-sm rounded-2xl p-4 bg-slate-900/60 ring-1 ring-white/8 overflow-hidden flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={he}
                  modifiers={{ hasGame: datesWithGames }}
                  modifiersStyles={{ hasGame: { fontWeight: 'bold', textDecoration: 'underline', color: '#fbbf24' } }}
                />
              </div>

              {!selectedDate && (
                <div className="w-full max-w-sm text-center py-8 rounded-2xl bg-slate-900/40 ring-1 ring-white/5">
                  <CalendarDays className="w-8 h-8 text-slate-600 mx-auto mb-2" strokeWidth={1.8} />
                  <p className="text-ink-3 text-sm font-bold">בחר תאריך מלוח השנה</p>
                </div>
              )}
              {selectedDate && !selectedRound && (
                <div className="w-full max-w-sm text-center py-8 rounded-2xl bg-slate-900/40 ring-1 ring-white/5">
                  <History className="w-8 h-8 text-slate-600 mx-auto mb-2" strokeWidth={1.8} />
                  <p className="text-ink-3 text-sm font-bold">לא נמצא משחק בתאריך זה</p>
                </div>
              )}
            </div>

            {/* Round details */}
            {selectedRound && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Admin-only: edit results + photo */}
                {isAdmin && (
                  <>
                    <div className="flex gap-2.5">
                      {editingRound === selectedRound.id ? (
                        <button
                          onClick={saveResults}
                          className="flex-1 flex items-center justify-center gap-2 min-h-[52px] rounded-xl st-foil font-black text-base shadow-[0_8px_22px_-8px_rgba(212,160,40,0.6)] active:scale-[0.98] transition-transform touch-manipulation"
                        >
                          <Save className="w-5 h-5" />
                          שמור תוצאות
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditing(selectedRound)}
                          className="flex-1 flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-slate-800/90 ring-1 ring-white/10 text-white font-black text-base active:scale-[0.98] transition-transform touch-manipulation"
                        >
                          <Save className="w-5 h-5 text-amber-300" />
                          עדכן תוצאות
                        </button>
                      )}
                      <button
                        onClick={() => setShowMover(true)}
                        aria-label="העברת שחקנים בין קבוצות"
                        className="grid place-items-center w-[52px] min-h-[52px] rounded-xl bg-slate-800/90 ring-1 ring-white/10 text-amber-300 active:scale-95 transition-transform touch-manipulation shrink-0"
                      >
                        <ArrowLeftRight className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-[0.65rem] text-ink-3 font-bold text-center flex items-center justify-center gap-1">
                      <Target className="w-3 h-3 text-amber-400" />
                      לחץ על שחקן לעריכת גולים
                    </p>

                    <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/8 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                        <Camera className="w-4 h-4 text-amber-400" strokeWidth={2.4} />
                        <span className="font-black text-white text-sm">תמונת ניצחון</span>
                      </div>
                      {selectedRound.victoryPhoto ? (
                        <div className="relative">
                          <img src={selectedRound.victoryPhoto} alt="תמונת ניצחון" loading="lazy" className="w-full object-contain bg-black max-h-72" />
                          <button
                            onClick={removePhoto}
                            aria-label="הסר תמונה"
                            className="absolute top-2 left-2 grid place-items-center w-9 h-9 bg-black/65 text-white rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 py-8 cursor-pointer active:bg-white/5 transition-colors">
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                          {uploadingPhoto ? (
                            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <div className="grid place-items-center w-12 h-12 rounded-full bg-amber-500/15 ring-1 ring-amber-500/30">
                                <Upload className="w-5 h-5 text-amber-400" />
                              </div>
                              <p className="text-ink-3 text-sm font-bold">לחץ להעלאת תמונת ניצחון</p>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </>
                )}

                {/* Victory photo — players see it read-only if it exists */}
                {!isAdmin && selectedRound.victoryPhoto && (
                  <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/8 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                      <Camera className="w-4 h-4 text-amber-400" strokeWidth={2.4} />
                      <span className="font-black text-white text-sm">תמונת ניצחון</span>
                    </div>
                    <img src={selectedRound.victoryPhoto} alt="תמונת ניצחון" loading="lazy" className="w-full object-contain bg-black max-h-72" />
                  </div>
                )}

                {/* Computed results summary — admin only */}
                {isAdmin && <AnimatePresence>
                  {resultsSummary && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="rounded-2xl bg-gradient-to-br from-emerald-900/35 to-slate-900/60 ring-1 ring-emerald-400/30 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="grid place-items-center w-7 h-7 rounded-lg bg-emerald-500/20 ring-1 ring-emerald-400/30 shrink-0">
                            <Trophy className="w-3.5 h-3.5 text-emerald-300" />
                          </div>
                          <span className="font-black text-white text-sm">סיכום המחזור</span>
                        </div>
                        <button
                          onClick={() => setResultsSummary(null)}
                          aria-label="סגור סיכום"
                          className="grid place-items-center w-7 h-7 rounded-lg bg-slate-700/60 ring-1 ring-white/8 text-slate-400 active:scale-95 transition-transform"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-slate-200 text-sm font-medium leading-relaxed" dir="rtl">
                        {resultsSummary}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>}

                {/* Teams */}
                <SectionTitle icon={Trophy}>הרכבי הקבוצות</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedRound.teams.map((teamPlayerIds, teamIndex) => {
                    const t = teamOf(teamIndex);
                    const isWinner = selectedRound.winningTeam === teamIndex;
                    const isOpening = selectedRound.openingTeams?.includes(teamIndex);

                    return (
                      <div
                        key={teamIndex}
                        className={`rounded-2xl overflow-hidden bg-slate-900/70 ring-1 ${isWinner ? 'ring-amber-400/50' : t.ring}`}
                      >
                        {/* header */}
                        <div className={`relative px-4 py-3 bg-gradient-to-l ${t.header}`}>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                                <h3 className={`font-black text-base ${t.text}`}>{t.name}</h3>
                                {isWinner && (
                                  <span className="grid place-items-center w-5 h-5 rounded-full st-foil">
                                    <Trophy className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[0.68rem] font-bold text-ink-2">
                                <span className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span className="tnum">{getTeamAverage(teamPlayerIds)}</span>
                                </span>
                                {isOpening && <span className="text-emerald-300">· פתחה את המחזור</span>}
                              </div>
                            </div>
                            {editingRound === selectedRound.id ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => updateWins(teamIndex, -1)}
                                  aria-label="הפחת ניצחון"
                                  className="grid place-items-center w-10 h-10 rounded-full bg-black/40 text-white active:bg-black/60 touch-manipulation"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="tnum text-white font-black text-xl min-w-[1.75rem] text-center">
                                  {tempWins[teamIndex] || 0}
                                </span>
                                <button
                                  onClick={() => updateWins(teamIndex, 1)}
                                  aria-label="הוסף ניצחון"
                                  className="grid place-items-center w-10 h-10 rounded-full bg-black/40 text-white active:bg-black/60 touch-manipulation"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ) : selectedRound.teamWins?.[teamIndex] !== undefined ? (
                              <span className="tnum text-white font-black text-2xl shrink-0">
                                {selectedRound.teamWins[teamIndex]}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* players */}
                        <div className="divide-y divide-white/5">
                          {teamPlayerIds.map((playerId) => {
                            const player = players.find(p => p.id === playerId);
                            if (!player) return null;
                            const isGoalkeeper = selectedRound.goalkeepers?.[teamIndex] === playerId;
                            const goals = selectedRound.player_goals?.[playerId];
                            const RowTag = isAdmin ? 'button' : 'div';
                            return (
                              <RowTag
                                key={playerId}
                                onClick={isAdmin ? () => setEditingPlayer({ player, teamIndex }) : undefined}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-right ${
                                  isAdmin ? 'cursor-pointer hover:bg-white/5 active:bg-white/8 transition-colors touch-manipulation' : ''
                                }`}
                              >
                                <div className="relative shrink-0">
                                  {player.image ? (
                                    <img src={player.image} alt={player.name} loading="lazy" className="w-9 h-9 rounded-full object-cover ring-1 ring-white/15" />
                                  ) : (
                                    <div className="grid place-items-center w-9 h-9 rounded-full bg-slate-700 ring-1 ring-white/10">
                                      <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                  )}
                                  {isGoalkeeper && (
                                    <div className="absolute -bottom-1 -right-1 grid place-items-center w-4 h-4 bg-sky-500 rounded-full ring-2 ring-slate-900">
                                      <Shield className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-bold text-sm truncate">{player.name}</p>
                                  <div className="flex items-center gap-0.5 mt-0.5">{renderStars(player.rating || 3)}</div>
                                </div>
                                {isAdmin && goals > 0 && (
                                  <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-500/30">
                                    <Target className="w-3 h-3 text-amber-400" strokeWidth={2.4} />
                                    <span className="text-amber-300 font-black text-xs tnum">{goals}</span>
                                  </div>
                                )}
                              </RowTag>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {isAdmin && showMover && selectedRound && (
        <TeamPlayerMover
          round={selectedRound}
          players={players}
          onClose={() => setShowMover(false)}
          onSave={(newTeams) => updateTeamsMutation.mutate({ roundId: selectedRound.id, teams: newTeams })}
        />
      )}

      <GoalEditorSheet
        open={!!editingPlayer}
        player={editingPlayer?.player}
        teamIndex={editingPlayer?.teamIndex}
        currentGoals={editingPlayer ? (selectedRound?.player_goals?.[editingPlayer.player.id] || 0) : 0}
        onClose={() => setEditingPlayer(null)}
        onChange={handleGoalChange}
        saving={savingGoals}
      />
    </div>
  );
}
