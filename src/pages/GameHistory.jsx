import React, { useState } from 'react';
import { Round, Player, uploadFile } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { History, Trophy, User, Star, Shield, Plus, Minus, Save, ArrowLeftRight, Camera, Upload, X, CalendarDays } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import TeamPlayerMover from '@/components/history/TeamPlayerMover';
import { PageHeader, SectionTitle, EmptyState, Skeleton } from '@/components/ui/lux';

const TEAM = [
  { name: 'הצהובים', dot: 'bg-yellow-400', header: 'from-yellow-500/20 to-yellow-600/5', ring: 'ring-yellow-500/35', text: 'text-yellow-300' },
  { name: 'הכחולים', dot: 'bg-blue-400',  header: 'from-blue-500/20 to-blue-600/5',   ring: 'ring-blue-500/35',   text: 'text-blue-300' },
  { name: 'הכתומים', dot: 'bg-orange-400', header: 'from-orange-500/20 to-orange-600/5', ring: 'ring-orange-500/35', text: 'text-orange-300' },
];
const teamOf = (i) => TEAM[i % 3];

export default function GameHistory() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingRound, setEditingRound] = useState(null);
  const [tempWins, setTempWins] = useState({});
  const [showMover, setShowMover] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const queryClient = useQueryClient();

  const { data: rounds = [], isLoading } = useQuery({
    queryKey: ['rounds'],
    queryFn: () => Round.list('-created_date'),
  });
  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
  });

  const updateRoundMutation = useMutation({
    mutationFn: ({ roundId, teamWins, winningTeam }) =>
      Round.update(roundId, { teamWins, winningTeam }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
      toast.success('התוצאות עודכנו בהצלחה');
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
            {/* Calendar */}
            <div className="rounded-2xl p-3 bg-slate-900/60 ring-1 ring-white/8 overflow-hidden">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={he}
                className="mx-auto w-full"
                modifiers={{ hasGame: datesWithGames }}
                modifiersStyles={{ hasGame: { fontWeight: 'bold', textDecoration: 'underline', color: '#fbbf24' } }}
              />
            </div>

            {!selectedDate && (
              <div className="text-center py-9 rounded-2xl bg-slate-900/40 ring-1 ring-white/5">
                <CalendarDays className="w-9 h-9 text-slate-600 mx-auto mb-2" strokeWidth={1.8} />
                <p className="text-ink-3 text-sm font-bold">בחר תאריך מלוח השנה</p>
              </div>
            )}
            {selectedDate && !selectedRound && (
              <div className="text-center py-9 rounded-2xl bg-slate-900/40 ring-1 ring-white/5">
                <History className="w-9 h-9 text-slate-600 mx-auto mb-2" strokeWidth={1.8} />
                <p className="text-ink-3 text-sm font-bold">לא נמצא משחק בתאריך זה</p>
              </div>
            )}

            {/* Round details */}
            {selectedRound && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Game info banner */}
                <div className="relative rounded-2xl p-4 overflow-hidden bg-gradient-to-l from-emerald-800/70 to-emerald-950/70 ring-1 ring-emerald-500/30">
                  <div className="absolute -top-8 -left-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                  <h2 className="relative text-white text-lg font-black">
                    {format(new Date(selectedRound.date), 'dd MMMM yyyy', { locale: he })}
                  </h2>
                  <div className="relative flex items-center gap-2.5 mt-1 text-sm font-bold text-emerald-200/90">
                    <span className="tnum">{selectedRound.teams.length} קבוצות</span>
                    <span className="text-emerald-400/50">·</span>
                    <span className="tnum">{selectedRound.teams.flat().length} שחקנים</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5">
                  {editingRound === selectedRound.id ? (
                    <button
                      onClick={saveResults}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[52px] rounded-xl st-foil font-black text-base shadow-[0_8px_22px_-8px_rgba(212,160,40,0.6)] active:scale-[0.98] transition-transform"
                    >
                      <Save className="w-5 h-5" />
                      שמור תוצאות
                    </button>
                  ) : (
                    <button
                      onClick={() => startEditing(selectedRound)}
                      className="flex-1 flex items-center justify-center min-h-[52px] rounded-xl bg-slate-800/90 ring-1 ring-white/10 text-white font-black text-base active:scale-[0.98] transition-transform"
                    >
                      עדכן תוצאות
                    </button>
                  )}
                  <button
                    onClick={() => setShowMover(true)}
                    aria-label="העברת שחקנים בין קבוצות"
                    className="grid place-items-center w-[52px] min-h-[52px] rounded-xl bg-slate-800/90 ring-1 ring-white/10 text-amber-300 active:scale-95 transition-transform shrink-0"
                  >
                    <ArrowLeftRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Victory photo */}
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
                                  className="grid place-items-center w-8 h-8 rounded-full bg-black/40 text-white active:bg-black/60"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="tnum text-white font-black text-xl min-w-[1.75rem] text-center">
                                  {tempWins[teamIndex] || 0}
                                </span>
                                <button
                                  onClick={() => updateWins(teamIndex, 1)}
                                  aria-label="הוסף ניצחון"
                                  className="grid place-items-center w-8 h-8 rounded-full bg-black/40 text-white active:bg-black/60"
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
                            return (
                              <div key={playerId} className="flex items-center gap-3 px-3 py-2.5">
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
                              </div>
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

      {showMover && selectedRound && (
        <TeamPlayerMover
          round={selectedRound}
          players={players}
          onClose={() => setShowMover(false)}
          onSave={(newTeams) => updateTeamsMutation.mutate({ roundId: selectedRound.id, teams: newTeams })}
        />
      )}
    </div>
  );
}
