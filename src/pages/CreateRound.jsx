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
import { callApi } from '@/lib/apiClient';

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
  // Bumped on every reshuffle so the preview re-runs its entry animation —
  // visible feedback even when the optimizer lands on a similar arrangement.
  const [shuffleTick, setShuffleTick] = useState(0);
  // Free-text coach instructions + their AI-parsed structured constraints
  // (pins / together / apart / opening) — honored by balanceTeams.
  const [instructions, setInstructions] = useState('');
  const [constraints, setConstraints] = useState(null);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('-rating'),
  });

  const requiredPlayers = numTeams * playersPerTeam;

  const handleNextFromSettings = () => {
    setStep(2);
  };

  // Parses free-text coach instructions via the server (Claude) into
  // structured constraints and surfaces what was understood. Returns null on
  // empty text or failure — the round then continues unconstrained.
  const parseInstructions = async (text, playerIds, teamCount) => {
    if (!text?.trim()) return null;
    const tId = toast.loading('מפענח את ההוראות שלך…');
    try {
      const roster = playerIds.map((id) => {
        const p = players.find((x) => x.id === id);
        return { id, name: p?.name || '' };
      });
      const res = await callApi('/api/parse-round-instructions', {
        text, players: roster, numTeams: teamCount,
      });
      const pd = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(pd.error || `שגיאה ${res.status}`);
      if (pd.summary) toast.success('ההוראות פוענחו ✓', { description: pd.summary, duration: 7000 });
      if (pd.unclear?.length) {
        toast.warning('לא פוענח', { description: pd.unclear.join(' · '), duration: 8000 });
      }
      return pd;
    } catch (e) {
      toast.warning('פיענוח ההוראות נכשל — ממשיך בלי הנחיות', { description: e?.message });
      return null;
    } finally {
      toast.dismiss(tId);
    }
  };

  const handleNextFromSelection = async () => {
    // Parse the coach's free-text instructions (if any) into structured
    // constraints BEFORE the first balance, so it already honors them.
    const cons = await parseInstructions(instructions, selectedPlayers, numTeams);
    setConstraints(cons);
    // Distribute players into the fairest balanced split right away (not a plain
    // random round-robin) so the first preview is already as equal as possible.
    setTeams(balanceTeams(selectedPlayers, null, numTeams, cons));
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
  const balanceTeams = (playerIds, avoidTeams = null, teamCount = numTeams, cons = constraints) => {
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

    // Coach constraints (AI-parsed): pins are honored by construction; a
    // candidate violating together/apart is simply rejected.
    const pinById = new Map(
      (cons?.pins || [])
        .filter((p) => p.team < teamCount)
        .map((p) => [p.playerId, p.team])
    );
    const teamIndexOf = (teams, id) => teams.findIndex((t) => t.some((p) => p.id === id));
    const satisfies = (teams) => {
      // negative pins: the player must NOT be on that team
      for (const { playerId, team } of cons?.avoid || []) {
        if (team < teamCount && teamIndexOf(teams, playerId) === team) return false;
      }
      for (const [a, b] of cons?.together || []) {
        const ta = teamIndexOf(teams, a);
        const tb = teamIndexOf(teams, b);
        if (ta >= 0 && tb >= 0 && ta !== tb) return false;
      }
      for (const [a, b] of cons?.apart || []) {
        const ta = teamIndexOf(teams, a);
        const tb = teamIndexOf(teams, b);
        if (ta >= 0 && tb >= 0 && ta === tb) return false;
      }
      return true;
    };

    // One random split honoring the target sizes (+ pinned players).
    const randomSplit = () => {
      const teams = Array.from({ length: teamCount }, () => []);
      const rest = [];
      for (const p of roster) {
        const t = pinById.get(p.id);
        if (t !== undefined && teams[t].length < sizes[t]) teams[t].push(p);
        else rest.push(p);
      }
      const shuffled = [...rest].sort(() => Math.random() - 0.5);
      for (let i = 0; i < teamCount; i++) {
        while (teams[i].length < sizes[i] && shuffled.length) teams[i].push(shuffled.shift());
      }
      return teams;
    };

    // Two objectives, in priority order:
    //   1. Rating equality — primary, exactly as always.
    //   2. Even spread of positions (CB/MC/ST) across the teams — chosen among
    //      the arrangements whose rating spread is within RATING_SLACK of the
    //      best found, so team strength stays effectively optimal while no
    //      team ends up with all the defenders and no striker.
    const ATTEMPTS = 1200;
    const RATING_SLACK = 0.1;
    const posImbalance = (teams) => {
      let score = 0;
      for (const pos of ['CB', 'MC', 'ST']) {
        const counts = teams.map((t) => t.reduce((s, p) => s + (p.position === pos ? 1 : 0), 0));
        score += Math.max(...counts) - Math.min(...counts);
      }
      return score;
    };
    const keyOf = (teams) => idsOf(teams).map((t) => [...t].sort().join(',')).sort().join('|');

    const candidates = [];
    const seen = new Set();
    for (let i = 0; i < ATTEMPTS; i++) {
      const candidate = randomSplit();
      if (!satisfies(candidate)) continue;   // violates together/apart
      const k = keyOf(candidate);
      if (seen.has(k)) continue;
      seen.add(k);
      candidates.push({ teams: candidate, spread: spread(candidate), pos: posImbalance(candidate) });
    }

    if (candidates.length === 0) {
      // Over-constrained (e.g. contradicting instructions): warn and fall
      // back to a fully unconstrained balance rather than getting stuck.
      if (cons) {
        toast.warning('לא ניתן לקיים את כל ההוראות יחד — הכוחות חולקו בלעדיהן');
        return balanceTeams(playerIds, avoidTeams, teamCount, null);
      }
      return idsOf(randomSplit());
    }

    const bestSpread = Math.min(...candidates.map((c) => c.spread));
    const ratingPool = candidates.filter((c) => c.spread <= bestSpread + RATING_SLACK);
    const bestPos = Math.min(...ratingPool.map((c) => c.pos));
    const pool = ratingPool.filter((c) => c.pos === bestPos).map((c) => c.teams);

    // Prefer an arrangement different from the current one; fall back to any.
    const fresh = pool.filter((t) => !sameAs(t, avoidTeams));
    const choices = fresh.length ? fresh : pool;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    return idsOf(pick);
  };

  const handleReshufflePreview = () => {
    // Pass the current arrangement (as id arrays — sameAs expects team arrays,
    // not a precomputed key) so the reshuffle visibly differs from it.
    setTeams(balanceTeams(teams.flat(), teams));
    setShuffleTick((t) => t + 1);
  };

  const handleSaveTeams = () => {
    // Random goalkeepers based on current teams (no re-shuffle)
    const newGoalkeepers = {};
    teams.forEach((team, index) => {
      const randomIndex = Math.floor(Math.random() * team.length);
      newGoalkeepers[index] = team[randomIndex];
    });
    setGoalkeepers(newGoalkeepers);

    // Opening-match instructions: explicit colors win; otherwise a named
    // opening player pins their team as an opener.
    if (constraints?.openingTeams?.length === 2) {
      setOpeningTeams(constraints.openingTeams);
    } else if (constraints?.openingPlayerIds?.length) {
      const openerTeams = [...new Set(
        constraints.openingPlayerIds
          .map((pid) => teams.findIndex((t) => t.includes(pid)))
          .filter((i) => i >= 0)
      )];
      if (openerTeams.length >= 2) {
        setOpeningTeams([openerTeams[0], openerTeams[1]]);
      } else if (openerTeams.length === 1) {
        const others = teams.map((_, i) => i).filter((i) => i !== openerTeams[0]);
        setOpeningTeams([openerTeams[0], others[Math.floor(Math.random() * others.length)]]);
      }
    }

    // Move to opening team step
    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedPlayers([]);
    setTeams([]);
    setGoalkeepers({});
    setOpeningTeams(null);
    setConstraints(null);
  };

  const handleQuickRound = async (matchedPlayers, unmatched, quickInstructions = '') => {
    if (unmatched.length > 0) {
      toast.warning(`${unmatched.length} שמות לא זוהו: ${unmatched.join(', ')}`);
    }
    if (matchedPlayers.length === 0) {
      toast.error('לא זוהו שחקנים תואמים');
      return;
    }
    setShowQuickModal(false);
    setNumTeams(3);
    setPlayersPerTeam(6);
    // Fairest balanced split into 3 teams (same optimizer as the reshuffle).
    // Pass 3 explicitly — setNumTeams(3) above hasn't applied to state yet.
    const ids = matchedPlayers.map((p) => p.id);
    const cons = await parseInstructions(quickInstructions, ids, 3);
    setConstraints(cons);
    setTeams(balanceTeams(ids, null, 3, cons));
    setSelectedPlayers(ids);
    setGoalkeepers({});
    setOpeningTeams(null);
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
              instructions={instructions}
              setInstructions={setInstructions}
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
              shuffleTick={shuffleTick}
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