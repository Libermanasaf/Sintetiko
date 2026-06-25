import React, { useState } from 'react';
import { Player } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Shuffle, Zap, Check, Users } from 'lucide-react';
import QuickRoundModal from '@/components/round/QuickRoundModal';
import { toast } from 'sonner';
import StepSettings from '@/components/round/StepSettings';
import StepSelectPlayers from '@/components/round/StepSelectPlayers';
import StepTeamsPreview from '@/components/round/StepTeamsPreview';
import StepOpeningTeam from '@/components/round/StepOpeningTeam';
import { EmptyState } from '@/components/ui/lux';

const STEP_LABELS = ['הגדרות', 'בחירה', 'תצוגה', 'שמירה'];
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
    // Distribute players into the fairest balanced split right away (not a plain
    // random round-robin) so the first preview is already as equal as possible.
    setTeams(balanceTeams(selectedPlayers));
    setGoalkeepers({});
    setOpeningTeams(null);
    setStep(3);
  };

  // Balances players into the fairest split by average rating. Instead of a fixed
  // zigzag (which always returns the SAME teams and isn't truly optimal), we run
  // many randomized splits and keep the one with the smallest spread between team
  // averages — so the result is both genuinely balanced AND different each click
  // (you see players actually move). avoidTeams (optional) nudges away from the
  // previous arrangement so consecutive reshuffles visibly change.
  const balanceTeams = (playerIds, avoidTeams = null, teamCount = numTeams) => {
    const roster = playerIds
      .map((id) => players.find((p) => p.id === id))
      .filter(Boolean);
    const n = roster.length;
    if (n === 0) return Array.from({ length: teamCount }, () => []);

    // Target sizes: as even as possible (e.g. 17 into 3 → 6,6,5).
    const base = Math.floor(n / teamCount);
    const extra = n % teamCount;
    const sizes = Array.from({ length: teamCount }, (_, i) => base + (i < extra ? 1 : 0));

    const ratingOf = (p) => p.rating || 3;
    const avg = (team) => (team.length ? team.reduce((s, p) => s + ratingOf(p), 0) / team.length : 0);
    const spread = (teams) => {
      const avgs = teams.map(avg);
      return Math.max(...avgs) - Math.min(...avgs);
    };
    const idsOf = (teams) => teams.map((t) => t.map((p) => p.id));
    const sameAs = (teams, other) => {
      if (!other) return false;
      const key = (tt) => tt.map((t) => [...t].sort().join(',')).sort().join('|');
      return key(idsOf(teams)) === key(other);
    };

    // One random split honoring the target sizes.
    const randomSplit = () => {
      const shuffled = [...roster].sort(() => Math.random() - 0.5);
      const teams = [];
      let cursor = 0;
      for (let i = 0; i < teamCount; i++) {
        teams.push(shuffled.slice(cursor, cursor + sizes[i]));
        cursor += sizes[i];
      }
      return teams;
    };

    // Generate many candidate splits, keep the best spread found, and COLLECT all
    // distinct arrangements within a tiny tolerance of it. Then pick one at random
    // (preferring one different from the previous arrangement) — so every reshuffle
    // is both near-optimally balanced AND visibly different, instead of always
    // converging to the same single optimum.
    const TOLERANCE = 0.001;          // treat spreads this close as "equally good"
    const ATTEMPTS = 1200;
    let bestSpread = Infinity;
    let pool = [];                    // arrangements at (near-)best spread
    const seen = new Set();
    const keyOf = (teams) => idsOf(teams).map((t) => [...t].sort().join(',')).sort().join('|');

    for (let i = 0; i < ATTEMPTS; i++) {
      const candidate = randomSplit();
      const s = spread(candidate);
      if (s < bestSpread - TOLERANCE) {
        // Strictly better — reset the pool to this new best tier.
        bestSpread = s;
        pool = [candidate];
        seen.clear();
        seen.add(keyOf(candidate));
      } else if (s <= bestSpread + TOLERANCE) {
        // As good as the best tier — add it if we haven't seen this arrangement.
        const k = keyOf(candidate);
        if (!seen.has(k)) { seen.add(k); pool.push(candidate); }
        if (s < bestSpread) bestSpread = s;
      }
    }

    if (pool.length === 0) return idsOf(randomSplit());
    // Prefer an arrangement different from the current one; fall back to any.
    const fresh = pool.filter((t) => !sameAs(t, avoidTeams));
    const choices = fresh.length ? fresh : pool;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    return idsOf(pick);
  };

  const handleReshufflePreview = () => {
    // Pass the current arrangement so the reshuffle visibly differs from it.
    const newTeams = balanceTeams(teams.flat(), teams.map((t) => [...t].sort().join(',')).sort().join('|'));
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
    // Fairest balanced split into 3 teams (same optimizer as the reshuffle).
    // Pass 3 explicitly — setNumTeams(3) above hasn't applied to state yet.
    const ids = matchedPlayers.map((p) => p.id);
    setTeams(balanceTeams(ids, null, 3));
    setSelectedPlayers(ids);
    setGoalkeepers({});
    setOpeningTeams(null);
    setShowQuickModal(false);
    setStep(3);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-10">
      {showQuickModal && (
        <QuickRoundModal
          players={players}
          onClose={() => setShowQuickModal(false)}
          onConfirm={handleQuickRound}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid place-items-center w-11 h-11 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Shuffle className="w-5 h-5 text-emerald-300" strokeWidth={2.3} />
            </div>
            <h1 className="text-[clamp(1.3rem,5vw,1.65rem)] font-black text-white tracking-tight">
              יצירת מחזור
            </h1>
          </div>
          <button
            onClick={() => setShowQuickModal(true)}
            className="flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-xl st-foil text-sm font-black shadow-[0_6px_18px_-6px_rgba(212,160,40,0.6)] active:scale-95 transition-transform shrink-0"
          >
            <Zap className="w-4 h-4" />
            מחזור מהיר
          </button>
        </div>

        {/* Step indicator */}
        <div className="mt-6 flex items-start">
          {[1, 2, 3, 4].map((s) => {
            const done = step > s;
            const current = step === s;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className={`grid place-items-center w-9 h-9 rounded-full text-sm font-black transition-all duration-200 ${
                      done
                        ? 'st-foil'
                        : current
                          ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-400/60'
                          : 'bg-slate-800 text-slate-500 ring-1 ring-white/8'
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" strokeWidth={3} /> : s}
                  </div>
                  <span className={`text-[0.62rem] font-black ${current || done ? 'text-amber-300' : 'text-slate-600'}`}>
                    {STEP_LABELS[s - 1]}
                  </span>
                </div>
                {s < 4 && (
                  <div className="flex-1 h-1 mt-4 mx-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${step > s ? 'w-full bg-gradient-to-l from-amber-400 to-amber-600' : 'w-0'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* No players */}
      {players.length === 0 && (
        <EmptyState
          icon={Users}
          title="אין שחקנים בסגל"
          hint="הוסף שחקנים בעמוד ״סגל שחקנים״ כדי ליצור מחזור."
        />
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