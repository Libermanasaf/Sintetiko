import React, { useState } from 'react';
import { Player } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Users, Zap } from 'lucide-react';
import QuickRoundModal from '@/components/round/QuickRoundModal';
import { toast } from 'sonner';
import StepSettings from '@/components/round/StepSettings';
import StepSelectPlayers from '@/components/round/StepSelectPlayers';
import StepTeamsPreview from '@/components/round/StepTeamsPreview';
import StepOpeningTeam from '@/components/round/StepOpeningTeam';
export default function CreateRound() {
  const [step, setStep] = useState(1);
  const [numTeams, setNumTeams] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState(5);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [goalkeepers, setGoalkeepers] = useState({});
  const [openingTeams, setOpeningTeams] = useState(null);
  const [showQuickModal, setShowQuickModal] = useState(false);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('-rating'),
  });

  const requiredPlayers = numTeams * playersPerTeam;

  const handleNextFromSettings = () => {
    setStep(2);
  };

  const handleNextFromSelection = () => {
    // Distribute players to teams (initially random)
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    const newTeams = Array.from({ length: numTeams }, () => []);

    shuffled.forEach((playerId, index) => {
      const teamIndex = index % numTeams;
      newTeams[teamIndex].push(playerId);
    });

    setTeams(newTeams);
    setGoalkeepers({});
    setOpeningTeams(null);
    setStep(3);
  };

  const balanceTeams = (playerIds) => {
    // Balance teams using zigzag distribution
    const allPlayers = playerIds.map((playerId) =>
      players.find((p) => p.id === playerId)
    );

    // Sort by rating descending
    allPlayers.sort((a, b) => (b.rating || 3) - (a.rating || 3));

    // Zigzag distribution
    const newTeams = Array.from({ length: numTeams }, () => []);
    let direction = 1;
    let teamIndex = 0;

    allPlayers.forEach((player) => {
      newTeams[teamIndex].push(player.id);
      teamIndex += direction;

      if (teamIndex >= numTeams || teamIndex < 0) {
        direction *= -1;
        teamIndex += direction;
      }
    });

    return newTeams;
  };

  const handleReshufflePreview = () => {
    const newTeams = balanceTeams(teams.flat());
    setTeams(newTeams);
  };

  const handleSaveTeams = () => {
    // Random goalkeepers based on current teams (no re-shuffle)
    const newGoalkeepers = {};
    teams.forEach((team, index) => {
      const randomIndex = Math.floor(Math.random() * team.length);
      newGoalkeepers[index] = team[randomIndex];
    });
    setGoalkeepers(newGoalkeepers);

    // Move to opening team step
    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedPlayers([]);
    setTeams([]);
    setGoalkeepers({});
    setOpeningTeams(null);
  };

  const handleQuickRound = (matchedPlayers, unmatched) => {
    if (unmatched.length > 0) {
      toast.warning(`${unmatched.length} שמות לא זוהו: ${unmatched.join(', ')}`);
    }
    if (matchedPlayers.length === 0) {
      toast.error('לא זוהו שחקנים תואמים');
      return;
    }
    setNumTeams(3);
    setPlayersPerTeam(6);
    // Zigzag balance into 3 teams
    const sorted = [...matchedPlayers].sort((a, b) => (b.rating || 3) - (a.rating || 3));
    const newTeams = [[], [], []];
    let dir = 1, idx = 0;
    sorted.forEach(player => {
      newTeams[idx].push(player.id);
      idx += dir;
      if (idx >= 3 || idx < 0) { dir *= -1; idx += dir; }
    });
    setTeams(newTeams);
    setSelectedPlayers(matchedPlayers.map(p => p.id));
    setGoalkeepers({});
    setOpeningTeams(null);
    setShowQuickModal(false);
    setStep(3);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-8">
      {showQuickModal && (
        <QuickRoundModal
          players={players}
          onClose={() => setShowQuickModal(false)}
          onConfirm={handleQuickRound}
        />
      )}
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-900/50 rounded-xl">
            <Shuffle className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">יצירת מחזור</h1>
        </div>
        <button
          onClick={() => setShowQuickModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow transition-colors"
        >
          <Zap className="w-4 h-4" />
          מחזור מהיר
        </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mt-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-500'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-5 h-1 mx-0.5 rounded ${
                    step > s ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2 text-xs text-slate-500">
          <span>הגדרות</span>
          <span>בחירה</span>
          <span>תצוגה</span>
          <span>שמירה</span>
        </div>
      </div>

      {/* No Players Warning */}
      {players.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            אין שחקנים בסגל
          </h3>
          <p className="text-slate-400">
            הוסף שחקנים בעמוד "סגל שחקנים" כדי ליצור מחזור
          </p>
        </motion.div>
      )}

      {/* Steps */}
      {players.length > 0 && (
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepSettings
              key="settings"
              numTeams={numTeams}
              setNumTeams={setNumTeams}
              playersPerTeam={playersPerTeam}
              setPlayersPerTeam={setPlayersPerTeam}
              onNext={handleNextFromSettings}
              totalPlayers={players.length}
            />
          )}
          {step === 2 && (
            <StepSelectPlayers
              key="select"
              players={players}
              selectedPlayers={selectedPlayers}
              setSelectedPlayers={setSelectedPlayers}
              requiredPlayers={requiredPlayers}
              onNext={handleNextFromSelection}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepTeamsPreview
              key="preview"
              teams={teams}
              players={players}
              onSave={handleSaveTeams}
              onReshuffle={handleReshufflePreview}
              onTeamsChange={setTeams}
            />
          )}
          {step === 4 && (
            <StepOpeningTeam
              key="opening"
              numTeams={numTeams}
              openingTeams={openingTeams}
              setOpeningTeams={setOpeningTeams}
              teams={teams}
              goalkeepers={goalkeepers}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}