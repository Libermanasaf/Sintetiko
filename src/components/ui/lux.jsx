import React from 'react';

// ─── Gradient-border luxury card ───────────────────────────────────────────
// Wrap content in a 1px gold/emerald gradient border over a dark gradient fill.
const ACCENT_BORDER = {
  amber:   'from-amber-300/45 via-amber-600/15 to-transparent',
  emerald: 'from-emerald-400/45 via-emerald-700/15 to-transparent',
  blue:    'from-blue-400/45 via-blue-700/15 to-transparent',
  slate:   'from-slate-400/35 via-slate-700/15 to-transparent',
};

export function LuxCard({ children, className = '', accent = 'amber', clip = false, ...props }) {
  return (
    <div
      className={`relative rounded-2xl p-px bg-gradient-to-br ${ACCENT_BORDER[accent]} ${className}`}
      {...props}
    >
      <div className={`rounded-[15px] bg-gradient-to-b from-slate-800/95 to-slate-950 h-full ${clip ? 'overflow-hidden' : ''}`}>
        {children}
      </div>
    </div>
  );
}

// ─── Sticky page header ────────────────────────────────────────────────────
const ICON_ACCENT = {
  amber:   'bg-amber-500/15 border-amber-500/30 text-amber-400',
  emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  blue:    'bg-blue-500/15 border-blue-500/30 text-blue-400',
};

export function PageHeader({ icon: Icon, title, subtitle, accent = 'amber', right }) {
  return (
    <div className="sticky top-16 z-20 bg-slate-950/95 backdrop-blur-md px-4 py-3">
      {/* gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl border shrink-0 ${ICON_ACCENT[accent]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-slate-500 text-xs truncate">{subtitle}</p>}
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
      {Icon && <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
      <span className="text-amber-300/90 font-black text-xs tracking-widest uppercase shrink-0">{children}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-amber-400/40 to-transparent" />
    </div>
  );
}
