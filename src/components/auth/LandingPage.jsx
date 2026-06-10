import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, UserPlus, Mail, ArrowRight, KeyRound, LogIn, Clock,
  Sparkles, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════════════════
//  Hero gold crest — large variant of the app's signature emblem
// ═══════════════════════════════════════════════════════════════════
function HeroCrest() {
  return (
    <svg viewBox="0 0 112 112" className="w-[6.5rem] h-[6.5rem] sm:w-28 sm:h-28" aria-hidden="true">
      <defs>
        <linearGradient id="lpGold" x1="12" y1="6" x2="100" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde9b8" />
          <stop offset="34%" stopColor="#f0c25a" />
          <stop offset="62%" stopColor="#c98c1c" />
          <stop offset="100%" stopColor="#7e530f" />
        </linearGradient>
        <radialGradient id="lpCore" cx="42%" cy="32%" r="76%">
          <stop offset="0%" stopColor="#1a6a4a" />
          <stop offset="62%" stopColor="#0c3424" />
          <stop offset="100%" stopColor="#040a08" />
        </radialGradient>
        <radialGradient id="lpHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f3d27e" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#f3d27e" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#f3d27e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* outer halo */}
      <circle cx="56" cy="56" r="54" fill="url(#lpHalo)" />
      {/* gold ring */}
      <circle cx="56" cy="56" r="50" fill="url(#lpGold)" />
      {/* inner hairline */}
      <circle cx="56" cy="56" r="46.5" fill="none" stroke="#f3d27e" strokeWidth="0.6" strokeOpacity="0.7" />
      {/* dark core */}
      <circle cx="56" cy="56" r="44" fill="url(#lpCore)" />
      {/* inner gold hairline */}
      <circle cx="56" cy="56" r="44" fill="none" stroke="#f3d27e" strokeWidth="1.1" strokeOpacity="0.55" />
      {/* radial sun rays */}
      <g transform="translate(56 56)" stroke="url(#lpGold)" strokeWidth="3.6" strokeLinecap="round" fill="none">
        <line x1="0" y1="-11" x2="0" y2="-26" />
        <line x1="9" y1="-3" x2="24.7" y2="-8" />
        <line x1="5.6" y1="7.7" x2="15.2" y2="20.8" />
        <line x1="-5.6" y1="7.7" x2="-15.2" y2="20.8" />
        <line x1="-9" y1="-3" x2="-24.7" y2="-8" />
      </g>
      {/* pentagon center (subtle ball facet) */}
      <path
        d="M56,43.4 L68.1,52.18 L63.5,66.4 L48.5,66.4 L43.9,52.18 Z"
        fill="url(#lpGold)"
        opacity="0.96"
      />
      {/* tiny initial flourish */}
      <text
        x="56" y="58"
        textAnchor="middle"
        fontFamily="Heebo, system-ui, sans-serif"
        fontSize="11"
        fontWeight="900"
        fill="#0a0e14"
        opacity="0.85"
      >S</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Floating gold motes — ambient cinematic micro-detail
// ═══════════════════════════════════════════════════════════════════
function GoldMotes() {
  const seeds = React.useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({
      left: `${8 + i * 10.5 + (i % 2) * 3}%`,
      top:  `${15 + ((i * 17) % 60)}%`,
      size: i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2,
      dur:  4 + (i % 4) * 0.7,
      delay: i * 0.45,
      drift: i % 2 ? -22 : 22,
    })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {seeds.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-amber-300/70 shadow-[0_0_6px_rgba(245,200,90,0.6)]"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
          animate={{ y: [0, -30, 0], x: [0, s.drift, 0], opacity: [0.15, 0.85, 0.15] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Eyebrow rule — premium gold framed label
// ═══════════════════════════════════════════════════════════════════
function EyebrowRule({ children, width = 'w-8' }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <span className={`h-px ${width} bg-gradient-to-l from-transparent to-amber-400/60`} />
      <span className="text-[0.6rem] font-black tracking-[0.36em] text-amber-300/90 uppercase whitespace-nowrap">
        {children}
      </span>
      <span className={`h-px ${width} bg-gradient-to-r from-transparent to-amber-400/60`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Premium input field
// ═══════════════════════════════════════════════════════════════════
function LuxInput({ icon: Icon, accent = 'emerald', type, value, onChange, placeholder, dir }) {
  const focusRing = accent === 'amber' ? 'focus-within:ring-amber-400/40 focus-within:border-amber-400/50'
                                       : 'focus-within:ring-emerald-400/40 focus-within:border-emerald-400/50';
  return (
    <div className={`relative flex items-center bg-stadium-2/80 border border-white/8 rounded-xl transition-all ring-1 ring-transparent ${focusRing}`}>
      <Icon className="w-4.5 h-4.5 text-ink-3 absolute right-3.5 top-1/2 -translate-y-1/2" strokeWidth={2.2} />
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        className="w-full bg-transparent rounded-xl py-3.5 pr-11 pl-4 text-white placeholder:text-ink-3/70 focus:outline-none text-[0.95rem] font-medium"
        placeholder={placeholder}
        dir={dir || 'ltr'}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Main LandingPage
// ═══════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('selection');
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [squadPlayers, setSquadPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setError('');
    setView('login-form');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (selectedRole === 'admin' && email.toLowerCase() !== 'libermanasaf@gmail.com') {
      setError('אין לך הרשאות ניהול. אנא התחבר כשחקן.');
      return;
    }
    setIsLoading(true);
    try {
      const { error: loginError } = await login(selectedRole, email, password);
      setIsLoading(false);
      if (loginError) {
        setError(loginError.message || 'אימייל או סיסמה שגויים');
        return;
      }
      navigate(selectedRole === 'admin' ? '/' : '/PlayerHome');
    } catch {
      setIsLoading(false);
      setError('אירעה שגיאה בחיבור למערכת');
    }
  };

  useEffect(() => {
    if (view !== 'register') return;
    const fetchUnlinkedPlayers = async () => {
      setSelectedPlayerId('');
      if (!supabase) {
        try {
          const players = JSON.parse(localStorage.getItem('sintetiko_Player') || '[]');
          const unlinked = players
            .filter(p => !p.email && !p.user_id)
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
          setSquadPlayers(unlinked);
        } catch (err) {
          console.error('Error reading players from local storage:', err);
        }
        return;
      }
      try {
        // Use the unlinked_players() RPC: returns only id+name of players not yet
        // linked to an account. Avoids reading the email column (now admin-only).
        const { data, error } = await supabase.rpc('unlinked_players');
        if (error) {
          console.error('Error fetching players:', error.message);
          return;
        }
        if (data) setSquadPlayers(data);
      } catch (err) {
        console.error('Error in fetchUnlinkedPlayers:', err);
      }
    };
    fetchUnlinkedPlayers();
  }, [view]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      setError('אנא בחר שחקן מהסגל');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const { error: regError } = await register(email, password, selectedPlayerId);
      setIsLoading(false);
      if (regError) {
        setError(regError.message || 'שגיאה ברישום המשתמש');
        return;
      }
      setView('email-sent');
    } catch {
      setIsLoading(false);
      setError('אירעה שגיאה במהלך ההרשמה');
    }
  };

  const isAdminFlow = selectedRole === 'admin';
  const accentBg = isAdminFlow ? 'bg-amber-500/15 ring-amber-500/30' : 'bg-emerald-500/15 ring-emerald-500/30';

  return (
    <div
      dir="rtl"
      className="min-h-screen st-stage flex items-center justify-center px-5 py-8 sm:py-12 relative overflow-hidden"
    >
      {/* Background textures */}
      <div className="fixed inset-0 pointer-events-none st-pitch-lines" aria-hidden="true" />
      <div className="fixed inset-0 pointer-events-none st-grain" aria-hidden="true" />

      {/* Corner halos */}
      <div className="absolute top-[-18%] right-[-18%] w-[30rem] h-[30rem] bg-emerald-500/8 blur-[140px] rounded-full pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-18%] left-[-18%] w-[30rem] h-[30rem] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] bg-amber-500/[0.04] blur-[80px] rounded-full pointer-events-none" aria-hidden="true" />

      {/* Floating motes */}
      <GoldMotes />

      {/* Content card */}
      <div className="relative z-10 w-full max-w-[22rem] sm:max-w-sm flex flex-col items-center">
        <AnimatePresence mode="wait">
          {/* ═══ SELECTION ═══════════════════════════════════════════ */}
          {view === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col items-center"
            >
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <EyebrowRule width="w-9">Football · Club</EyebrowRule>
              </motion.div>

              {/* Wordmark */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.55 }}
                className="st-gold-text font-black tracking-[-0.025em] leading-[0.92] text-center mt-4"
                style={{ fontSize: 'clamp(2.65rem, 11.5vw, 3.6rem)' }}
              >
                סינתטיקו
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62, duration: 0.55 }}
                className="text-white font-black tracking-[0.08em] leading-none mt-2"
                style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}
              >
                חולון
              </motion.h2>

              {/* EST line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.78, duration: 0.5 }}
                className="flex items-center gap-2.5 mt-5"
              >
                <span className="h-px w-12 bg-gradient-to-l from-transparent via-amber-400/40 to-amber-400/60" />
                <span className="text-[0.56rem] font-black tracking-[0.42em] text-ink-3 uppercase">
                  Est. <bdi dir="ltr">2024</bdi>
                </span>
                <span className="h-px w-12 bg-gradient-to-r from-transparent via-amber-400/40 to-amber-400/60" />
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.88, duration: 0.5 }}
                className="text-ink-2 text-[0.92rem] font-medium leading-relaxed text-center mt-5 mb-8 max-w-[18rem]"
              >
                המקום שבו מחזורים
                <br />
                <span className="text-white font-black">נהפכים לאגדות</span>
              </motion.p>

              {/* Role cards */}
              <div className="w-full space-y-3">
                {/* Player */}
                <motion.button
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelection('player')}
                  className="group w-full relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-emerald-400/45 via-emerald-500/15 to-emerald-700/5 active:from-emerald-300/70 transition-all min-h-[68px]"
                  aria-label="כניסה ככדורגלן פעיל"
                >
                  <div className="relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-stadium-2/95 text-right">
                    <div className="grid place-items-center w-12 h-12 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 shrink-0">
                      <User className="w-[22px] h-[22px] text-emerald-300" strokeWidth={2.3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-black text-[1.02rem] leading-tight">כדורגלן פעיל</h3>
                      <p className="text-ink-3 text-xs font-bold mt-0.5">כניסת שחקן סגל</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-emerald-400/70 shrink-0" strokeWidth={2.3} />
                  </div>
                </motion.button>

                {/* Admin — gold premium */}
                <motion.button
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.12, duration: 0.5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelection('admin')}
                  className="group w-full relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-amber-300/65 via-amber-500/25 to-amber-700/10 active:from-amber-300/85 transition-all min-h-[68px]"
                  aria-label='כניסה כיו"ר ההתאחדות'
                >
                  <div className="relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-stadium-2/95 text-right">
                    <div className="grid place-items-center w-12 h-12 rounded-xl st-foil shrink-0 shadow-[0_6px_18px_-6px_rgba(224,169,46,0.6)]">
                      <Shield className="w-[22px] h-[22px] text-slate-900" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-black text-[1.02rem] leading-tight">יו״ר ההתאחדות</h3>
                      <p className="text-ink-3 text-xs font-bold mt-0.5">כניסת מנהל המערכת</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-amber-300/80 shrink-0" strokeWidth={2.3} />
                  </div>
                </motion.button>
              </div>

              {/* OR divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.28, duration: 0.5 }}
                className="flex items-center gap-3 w-full mt-7 mb-5"
              >
                <span className="flex-1 h-px bg-gradient-to-l from-transparent to-white/12" />
                <span className="text-[0.62rem] font-black tracking-[0.42em] text-ink-3 uppercase">או</span>
                <span className="flex-1 h-px bg-gradient-to-r from-transparent to-white/12" />
              </motion.div>

              {/* Register CTA */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.38, duration: 0.5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setEmail(''); setPassword(''); setError(''); setView('register'); }}
                className="w-full flex items-center justify-center gap-2 min-h-[54px] rounded-xl ring-1 ring-white/12 bg-white/[0.04] hover:bg-white/[0.07] active:bg-white/[0.08] transition-colors text-ink-2"
              >
                <UserPlus className="w-[18px] h-[18px] text-amber-300/85" strokeWidth={2.3} />
                <span className="font-black text-sm">עדיין לא רשום? הצטרף לסגל</span>
              </motion.button>

              {/* Premium footer badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.55, duration: 0.6 }}
                className="mt-8 flex items-center gap-2 text-ink-3"
              >
                <Sparkles className="w-3 h-3 text-amber-400/60" />
                <span className="text-[0.58rem] font-black tracking-[0.38em] uppercase">
                  Premium Club Experience
                </span>
                <Sparkles className="w-3 h-3 text-amber-400/60" />
              </motion.div>
            </motion.div>
          )}

          {/* ═══ LOGIN FORM ═════════════════════════════════════════ */}
          {view === 'login-form' && (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col"
            >
              {/* Back */}
              <button
                onClick={() => setView('selection')}
                className="self-start mb-6 flex items-center gap-1.5 text-ink-3 hover:text-white transition-colors min-h-[40px] -mx-1 px-1"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-sm font-bold">חזרה לבחירת משתמש</span>
              </button>

              {/* Role badge */}
              <div className="mb-7 flex items-center gap-3">
                <div className={`grid place-items-center w-12 h-12 rounded-xl ring-1 ${accentBg}`}>
                  {isAdminFlow ? <Shield className="w-6 h-6 text-amber-300" strokeWidth={2.3} />
                                : <User className="w-6 h-6 text-emerald-300" strokeWidth={2.3} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-px w-5 bg-amber-400/50" />
                    <span className="text-[0.56rem] font-black tracking-[0.36em] text-amber-300/85 uppercase">
                      התחברות
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white leading-tight mt-1">
                    {isAdminFlow ? 'יו״ר ההתאחדות' : 'כדורגלן פעיל'}
                  </h2>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-start gap-2"
                  >
                    <span className="text-rose-400">⚠</span>
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[0.78rem] font-bold text-ink-2 mr-1">כתובת אימייל</label>
                  <LuxInput
                    icon={Mail}
                    accent={isAdminFlow ? 'amber' : 'emerald'}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[0.78rem] font-bold text-ink-2 mr-1">סיסמה</label>
                  <LuxInput
                    icon={KeyRound}
                    accent={isAdminFlow ? 'amber' : 'emerald'}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className={`w-full mt-5 min-h-[54px] rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
                    isAdminFlow
                      ? 'st-foil text-slate-900 shadow-[0_10px_28px_-10px_rgba(224,169,46,0.7)]'
                      : 'bg-gradient-to-l from-emerald-500 to-emerald-700 text-white shadow-[0_10px_28px_-10px_rgba(16,185,129,0.6)]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
                      <span>מתחבר...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>כניסה למערכת</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ═══ REGISTER ════════════════════════════════════════════ */}
          {view === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col"
            >
              <button
                onClick={() => setView('selection')}
                className="self-start mb-6 flex items-center gap-1.5 text-ink-3 hover:text-white transition-colors min-h-[40px] -mx-1 px-1"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-sm font-bold">חזרה למסך הראשי</span>
              </button>

              <div className="mb-7">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-px w-5 bg-amber-400/50" />
                  <span className="text-[0.56rem] font-black tracking-[0.36em] text-amber-300/85 uppercase">
                    הרשמה
                  </span>
                </div>
                <h2 className="text-[1.7rem] font-black text-white leading-tight">הצטרף לסגל</h2>
                <p className="text-ink-3 text-sm font-bold mt-1.5">הזן את פרטיך ובחר את שמך מהסגל</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-start gap-2"
                  >
                    <span className="text-rose-400">⚠</span>
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[0.78rem] font-bold text-ink-2 mr-1">כתובת אימייל</label>
                  <LuxInput
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[0.78rem] font-bold text-ink-2 mr-1">סיסמה</label>
                  <LuxInput
                    icon={KeyRound}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[0.78rem] font-bold text-ink-2 mr-1">בחר את שמך מסגל הקבוצה</label>
                  <div className="relative">
                    <select
                      required
                      value={selectedPlayerId}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      className="w-full bg-stadium-2/80 border border-white/8 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/40 transition-all cursor-pointer text-[0.95rem] font-medium appearance-none"
                    >
                      <option value="" disabled className="bg-stadium-2 text-ink-3">-- בחר שחקן --</option>
                      {squadPlayers.map((player) => (
                        <option key={player.id} value={player.id} className="bg-stadium-2 text-white">
                          {player.name}
                        </option>
                      ))}
                      {squadPlayers.length === 0 && (
                        <option value="" disabled className="bg-stadium-2 text-ink-3">
                          אין שחקנים פנויים בסגל
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !password || !selectedPlayerId}
                  className="w-full mt-5 min-h-[54px] rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-700 text-white font-black text-base shadow-[0_10px_28px_-10px_rgba(16,185,129,0.6)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>שולח...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>הצטרף לסגל</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ═══ EMAIL SENT ══════════════════════════════════════════ */}
          {view === 'email-sent' && (
            <motion.div
              key="email-sent"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col items-center text-center"
            >
              <div className="relative w-full rounded-3xl p-[1px] bg-gradient-to-br from-amber-300/55 via-amber-500/20 to-amber-700/10">
                <div className="rounded-3xl bg-stadium-2/95 ring-1 ring-amber-500/15 p-7 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.6, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                    className="relative mb-5"
                  >
                    <div className="absolute inset-0 bg-amber-400/30 blur-2xl rounded-full" />
                    <div className="relative grid place-items-center w-20 h-20 rounded-full st-foil shadow-[0_10px_30px_-8px_rgba(224,169,46,0.65)]">
                      <Clock className="w-10 h-10 text-slate-900" strokeWidth={2.2} />
                    </div>
                  </motion.div>

                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                    <span className="text-[0.62rem] font-black tracking-[0.36em] text-emerald-300/90 uppercase">
                      הרישום הושלם
                    </span>
                  </div>

                  <h2 className="text-[1.4rem] font-black text-white leading-tight mb-3">
                    הבקשה נשלחה לאישור
                  </h2>
                  <p className="text-ink-2 text-sm font-medium leading-relaxed mb-6">
                    יו״ר ההתאחדות יבחן את חשבונך וברגע שתאושר —
                    <br />
                    תוכל להיכנס לאזור האישי שלך.
                  </p>

                  <button
                    onClick={() => setView('selection')}
                    className="w-full min-h-[52px] rounded-xl bg-white/[0.05] ring-1 ring-white/12 hover:bg-white/[0.08] text-white font-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    חזרה למסך הראשי
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
