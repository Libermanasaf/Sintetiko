import React from 'react';

/* ═══════════════════════════════════════════════════════════════════
   STADIUM LUXURY — Shared primitives
   Every page composes from these. Backward-compatible accent names.
   ═══════════════════════════════════════════════════════════════════ */

// ─── Gradient-border luxury card ───────────────────────────────────────────
const ACCENT_BORDER = {
  amber:   'from-amber-300/45 via-slate-700/25 to-slate-800/10',
  gold:    'from-amber-300/45 via-slate-700/25 to-slate-800/10',
  emerald: 'from-emerald-400/45 via-slate-700/25 to-slate-800/10',
  pitch:   'from-emerald-400/45 via-slate-700/25 to-slate-800/10',
  blue:    'from-sky-400/40 via-slate-700/25 to-slate-800/10',
  sky:     'from-sky-400/40 via-slate-700/25 to-slate-800/10',
  violet:  'from-violet-400/40 via-slate-700/25 to-slate-800/10',
  slate:   'from-slate-400/30 via-slate-700/20 to-slate-800/10',
};

const ACCENT_GLOW = {
  amber:   'bg-amber-500/15',
  gold:    'bg-amber-500/15',
  emerald: 'bg-emerald-500/15',
  pitch:   'bg-emerald-500/15',
  blue:    'bg-sky-500/15',
  sky:     'bg-sky-500/15',
  violet:  'bg-violet-500/15',
  slate:   'bg-slate-500/10',
};

export function LuxCard({ children, className = '', accent = 'amber', clip = false, glow = false, ...props }) {
  const border = ACCENT_BORDER[accent] || ACCENT_BORDER.amber;
  return (
    <div
      className={`relative rounded-2xl p-px bg-gradient-to-br ${border} shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)] ${className}`}
      {...props}
    >
      <div className={`relative rounded-[15px] bg-gradient-to-b from-slate-800/95 to-slate-950 h-full ${clip ? 'overflow-hidden' : ''}`}>
        {glow && (
          <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl pointer-events-none ${ACCENT_GLOW[accent] || ACCENT_GLOW.amber}`} />
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Sticky page header ────────────────────────────────────────────────────
const ICON_ACCENT = {
  amber:   'bg-amber-500/15 border-amber-500/30 text-amber-300',
  gold:    'bg-amber-500/15 border-amber-500/30 text-amber-300',
  emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  pitch:   'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  blue:    'bg-sky-500/15 border-sky-500/30 text-sky-300',
  sky:     'bg-sky-500/15 border-sky-500/30 text-sky-300',
  violet:  'bg-violet-500/15 border-violet-500/30 text-violet-300',
  slate:   'bg-slate-500/15 border-slate-500/30 text-slate-300',
};

export function PageHeader({ icon: Icon, title, subtitle, accent = 'amber', right }) {
  const ic = ICON_ACCENT[accent] || ICON_ACCENT.amber;
  return (
    <div className="sticky top-16 z-20 bg-stadium/95 backdrop-blur-xl px-4 py-3.5">
      <div className="st-rule absolute bottom-0 left-0 right-0" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className={`grid place-items-center w-11 h-11 rounded-xl border shrink-0 ${ic}`}>
              <Icon className="w-5 h-5" strokeWidth={2.2} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[clamp(1.15rem,4.4vw,1.5rem)] font-black text-white tracking-tight leading-none truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-ink-3 text-xs font-semibold mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}

// ─── Section title with gold dividers ──────────────────────────────────────
export function SectionTitle({ children, icon: Icon, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-l from-amber-400/40 to-transparent" />
      {Icon && <Icon className="w-5 h-5 text-amber-400 shrink-0" strokeWidth={2.4} />}
      <span className="text-amber-300/90 font-black text-base tracking-wider shrink-0">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-amber-400/40 to-transparent" />
    </div>
  );
}

// ─── Eyebrow — small gold label between rules ──────────────────────────────
export function Eyebrow({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 ${className}`}>
      <span className="h-px w-7 bg-gradient-to-r from-amber-400/70 to-transparent" />
      <span className="text-[0.62rem] font-black tracking-[0.34em] text-amber-400/90 uppercase">
        {children}
      </span>
      <span className="h-px w-7 bg-gradient-to-l from-amber-400/70 to-transparent" />
    </div>
  );
}

// ─── Gold pill / chip ──────────────────────────────────────────────────────
const CHIP_TONE = {
  gold:   'bg-amber-500/12 text-amber-300 ring-amber-500/30',
  pitch:  'bg-emerald-500/12 text-emerald-300 ring-emerald-500/30',
  slate:  'bg-slate-500/15 text-slate-300 ring-slate-500/25',
  rose:   'bg-rose-500/12 text-rose-300 ring-rose-500/30',
  sky:    'bg-sky-500/12 text-sky-300 ring-sky-500/30',
};

export function Chip({ children, tone = 'gold', icon: Icon, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold ring-1 ${CHIP_TONE[tone] || CHIP_TONE.gold} ${className}`}>
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.6} />}
      {children}
    </span>
  );
}

// ─── Stat tile — large tabular number + label ──────────────────────────────
const STAT_TONE = {
  gold:  'text-amber-300',
  pitch: 'text-emerald-300',
  white: 'text-white',
  sky:   'text-sky-300',
};

export function StatTile({ value, label, icon: Icon, tone = 'gold', className = '' }) {
  return (
    <div className={`relative rounded-xl bg-slate-900/60 ring-1 ring-white/5 px-3 py-3 text-center overflow-hidden ${className}`}>
      {Icon && <Icon className={`w-4 h-4 mx-auto mb-1.5 ${STAT_TONE[tone] || STAT_TONE.gold}`} strokeWidth={2.3} />}
      <div className={`tnum text-2xl font-black leading-none ${STAT_TONE[tone] || STAT_TONE.gold}`}>
        {value}
      </div>
      <div className="text-ink-3 text-[0.66rem] font-bold mt-1.5 tracking-wide">{label}</div>
    </div>
  );
}

// ─── Primary gold button ───────────────────────────────────────────────────
export function GoldButton({ children, className = '', as: Tag = 'button', ...props }) {
  return (
    <Tag
      className={`relative inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl font-black text-[0.95rem]
        st-foil shadow-[0_8px_24px_-8px_rgba(212,160,40,0.6)]
        active:scale-[0.97] transition-transform duration-100
        disabled:opacity-50 disabled:pointer-events-none st-sweep ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, hint, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}>
      {Icon && (
        <div className="grid place-items-center w-16 h-16 rounded-2xl bg-slate-800/70 ring-1 ring-white/5 mb-4">
          <Icon className="w-8 h-8 text-slate-600" strokeWidth={1.8} />
        </div>
      )}
      <h3 className="text-white font-black text-base">{title}</h3>
      {hint && <p className="text-ink-3 text-sm font-medium mt-1.5 max-w-[16rem]">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Skeleton block ────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={`st-skeleton ${className}`} aria-hidden="true" />;
}
