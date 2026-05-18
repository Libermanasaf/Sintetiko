import React, { useState } from 'react';
import { Round, Player, uploadFile } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { History, Trophy, User, Star, Shield, Plus, Minus, Save, ArrowLeftRight, Camera, Upload, X } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import TeamPlayerMover from '@/components/history/TeamPlayerMover';

const TEAM_COLORS = [
  { header: 'bg-yellow-500', card: 'bg-yellow-400/90', text: 'text-white' },
  { header: 'bg-blue-700', card: 'bg-blue-600/90', text: 'text-white' },
  { header: 'bg-orange-600', card: 'bg-orange-500/90', text: 'text-white' },
  { header: 'bg-yellow-500', card: 'bg-yellow-400/90', text: 'text-white' },
  { header: 'bg-blue-700', card: 'bg-blue-600/90', text: 'text-white' },
  { header: 'bg-orange-600', card: 'bg-orange-500/90', text: 'text-white' },
];
const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים', 'הצהובים', 'הכחולים', 'הכתומים'];

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
      Promise.all(updates.map(({ playerId, wins }) =>
        Player.update(playerId, { wins })
      )),
  });

  const updateTeamsMutation = useMutation({
    mutationFn: ({ roundId, teams }) =>
      Round.update(roundId, { teams }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
      toast.success('סידור הקבוצות עודכן בהצלחה');
      setShowMover(false);
    },
  });

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

  const selectedRound = selectedDate
    ? rounds.find(round => isSameDay(new Date(round.date), selectedDate))
    : null;

  const datesWithGames = rounds.map(round => new Date(round.date));

  const startEditing = (round) => {
    setEditingRound(round.id);
    setTempWins(round.teamWins || {});
  };

  const updateWins = (teamIndex, delta) => {
    setTempWins(prev => ({
      ...prev,
      [teamIndex]: Math.max(0, (prev[teamIndex] || 0) + delta)
    }));
  };

  const saveResults = async () => {
    if (!selectedRound) return;
    const winningTeam = Object.entries(tempWins).reduce((max, [team, wins]) =>
      wins > (tempWins[max] || 0) ? parseInt(team) : max, 0);
    const winningPlayers = selectedRound.teams[winningTeam] || [];
    const playerUpdates = winningPlayers.map(playerId => {
      const player = players.find(p => p.id === playerId);
      return { playerId, wins: (player?.wins || 0) + 1 };
    });
    await updateRoundMutation.mutateAsync({ roundId: selectedRound.id, teamWins: tempWins, winningTeam });
    await updatePlayersMutation.mutateAsync(playerUpdates);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-white/30'}`} />
    ));
  };

  const getTeamAverage = (teamPlayerIds) => {
    const sum = teamPlayerIds.reduce((s, id) => s + (players.find(p => p.id === id)?.rating || 3), 0);
    return (sum / teamPlayerIds.length).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Sticky Header */}
      <div className="sticky top-16 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-xl font-black text-white">היסטוריית משחקים</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {rounds.length === 0 ? (
          <div className="text-center py-20">
            <History className="w-14 h-14 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">המשחקים שתשחקו יופיעו כאן</p>
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 overflow-hidden">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={he}
                className="mx-auto w-full"
                modifiers={{ hasGame: datesWithGames }}
                modifiersStyles={{ hasGame: { fontWeight: 'bold', textDecoration: 'underline', color: '#34d399' } }}
              />
            </div>

            {/* State messages */}
            {!selectedDate && (
              <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-slate-700/40">
                <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">בחר תאריך מלוח השנה</p>
              </div>
            )}
            {selectedDate && !selectedRound && (
              <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-slate-700/40">
                <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">לא נמצא משחק בתאריך זה</p>
              </div>
            )}

            {/* Round Details */}
            {selectedRound && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Game info */}
                <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-4 text-white shadow-lg border border-emerald-600/40">
                  <h2 className="text-lg font-black mb-1">
                    {format(new Date(selectedRound.date), 'dd MMMM yyyy', { locale: he })}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-emerald-200">
                    <span>{selectedRound.teams.length} קבוצות</span>
                    <span>·</span>
                    <span>{selectedRound.teams.flat().length} שחקנים</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {editingRound === selectedRound.id ? (
                    <Button onClick={saveResults} className="flex-1 h-13 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 font-bold text-base rounded-xl border border-emerald-500/40">
                      <Save className="w-5 h-5 ml-2" />
                      שמור תוצאות
                    </Button>
                  ) : (
                    <Button onClick={() => startEditing(selectedRound)} variant="outline" className="flex-1 h-13 rounded-xl border-slate-600 text-white bg-slate-800 hover:bg-slate-700 font-bold text-base">
                      עדכן תוצאות
                    </Button>
                  )}
                  <Button onClick={() => setShowMover(true)} variant="outline" className="h-13 w-13 rounded-xl border-slate-600 text-white bg-slate-800 hover:bg-slate-700 flex-shrink-0">
                    <ArrowLeftRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Victory Photo */}
                <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-sm">תמונת ניצחון</span>
                  </div>
                  {selectedRound.victoryPhoto ? (
                    <div className="relative">
                      <img src={selectedRound.victoryPhoto} alt="תמונת ניצחון" className="w-full object-contain bg-black max-h-72" />
                      <button onClick={removePhoto} className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-2 touch-manipulation">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 py-8 cursor-pointer active:bg-slate-700/30 transition-colors touch-manipulation">
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                      {uploadingPhoto ? (
                        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                            <Upload className="w-5 h-5 text-amber-400" />
                          </div>
                          <p className="text-slate-400 text-sm">לחץ להעלאת תמונת ניצחון</p>
                        </>
                      )}
                    </label>
                  )}
                </div>

                {/* Teams — stacked on mobile, grid on wider screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedRound.teams.map((teamPlayerIds, teamIndex) => {
                    const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
                    const isWinner = selectedRound.winningTeam === teamIndex;
                    const isOpening = selectedRound.openingTeams?.includes(teamIndex);

                    return (
                      <div key={teamIndex} className="rounded-2xl overflow-hidden shadow-lg border border-white/10">
                        {/* Team header */}
                        <div className={`${color.header} px-4 py-3 relative`}>
                          {isWinner && (
                            <div className="absolute top-2 left-2">
                              <div className="bg-amber-400 rounded-full p-1.5 shadow-lg">
                                <Trophy className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-black text-white text-base">{TEAM_NAMES[teamIndex]}</h3>
                              <div className="flex items-center gap-2 mt-0.5 text-white/80 text-xs">
                                <span>⭐ {getTeamAverage(teamPlayerIds)}</span>
                                {isOpening && <span>· ⚽ פתחה</span>}
                              </div>
                            </div>
                            {editingRound === selectedRound.id ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateWins(teamIndex, -1)} className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center active:bg-black/40 touch-manipulation">
                                  <Minus className="w-4 h-4 text-white" />
                                </button>
                                <span className="text-white font-black text-xl min-w-[2rem] text-center">{tempWins[teamIndex] || 0}</span>
                                <button onClick={() => updateWins(teamIndex, 1)} className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center active:bg-black/40 touch-manipulation">
                                  <Plus className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ) : selectedRound.teamWins?.[teamIndex] !== undefined ? (
                              <span className="text-white font-black text-2xl">{selectedRound.teamWins[teamIndex]}</span>
                            ) : null}
                          </div>
                        </div>

                        {/* Players */}
                        <div className={`${color.card} divide-y divide-white/10`}>
                          {teamPlayerIds.map((playerId) => {
                            const player = players.find(p => p.id === playerId);
                            if (!player) return null;
                            const isGoalkeeper = selectedRound.goalkeepers?.[teamIndex] === playerId;
                            return (
                              <div key={playerId} className="flex items-center gap-3 px-3 py-2.5">
                                <div className="relative flex-shrink-0">
                                  {player.image ? (
                                    <img src={player.image} alt={player.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/40" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                                      <User className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                  {isGoalkeeper && (
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                                      <Shield className="w-2.5 h-2.5 text-blue-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-semibold text-sm truncate">{player.name}</p>
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