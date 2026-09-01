import { ImageResponse } from '@vercel/og';
import { createClient } from '@supabase/supabase-js';
import { statsFromRounds, pickTeamOfMonth } from '../src/lib/teamOfMonth.js';

// PNG of the month's squad, used as the `image` of the team-of-the-month push.
// Android/Chrome renders it inside the notification; iOS ignores `image`
// entirely, which is why the push body still carries the names in text.
//
// Runs on the Edge runtime — @vercel/og needs it — so this file cannot use the
// node-only helpers in _supabaseAdmin.js and builds its own client.
export const config = { runtime: 'edge' };

const BG = '#0a0f1a';
const GOLD = '#e8b93c';
const INK = '#f1f5f9';
const MUTED = '#94a3b8';

// month=YYYY-MM (defaults to the previous month, matching the cron).
function monthWindow(monthKey) {
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    const [y, m] = monthKey.split('-').map(Number);
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
  }
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth(), 1),
  };
}

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const { start, end } = monthWindow(url.searchParams.get('month'));
    const monthName = new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(start);

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const [{ data: rounds }, { data: players }] = await Promise.all([
      supabase.from('rounds')
        .select('teams, winningTeam, date')
        .gte('date', start.toISOString())
        .lt('date', end.toISOString()),
      supabase.from('players').select('id, name, image'),
    ]);

    const nameById = new Map((players || []).map((p) => [p.id, p.name]));
    const imageById = new Map((players || []).map((p) => [p.id, p.image]));
    const squad = pickTeamOfMonth(statsFromRounds(rounds || []), nameById);

    // Built with createElement rather than JSX: files under /api are bundled
    // as plain JS with no JSX transform, so JSX here fails the Vercel build
    // (and with it the whole deployment, not just this endpoint).
    const h = (type, props, ...children) => ({
      type,
      props: { ...props, children: children.length === 1 ? children[0] : children },
      key: props && props.key != null ? props.key : null,
      $$typeof: Symbol.for('react.element'),
      ref: null,
    });

    const card = (p, i) => {
      const img = imageById.get(p.id);
      return h('div', {
        key: p.id,
        style: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: 168, padding: 16, borderRadius: 20,
          background: 'linear-gradient(180deg,#1e293b,#0b1220)',
          border: `2px solid ${i === 0 ? GOLD : '#334155'}`,
        },
      },
        h('div', { style: {
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, borderRadius: 8, background: GOLD,
          color: '#0a0f1a', fontSize: 20, fontWeight: 900, marginBottom: 10,
        } }, String(i + 1)),
        img
          ? h('img', { src: img, width: 92, height: 92, style: {
              borderRadius: 18, objectFit: 'cover', border: `3px solid ${GOLD}`,
            } })
          : h('div', { style: {
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 92, height: 92, borderRadius: 18, background: '#334155',
              border: `3px solid ${GOLD}`, fontSize: 40, color: MUTED,
            } }, (p.name || '?').charAt(0)),
        h('div', { style: {
          fontSize: 22, fontWeight: 900, color: INK, marginTop: 12,
          maxWidth: 150, overflow: 'hidden', whiteSpace: 'nowrap',
        } }, p.name),
        h('div', { style: { display: 'flex', gap: 8, marginTop: 10 } },
          h('div', { style: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.15)',
          } },
            h('div', { style: { fontSize: 22, fontWeight: 900, color: '#6ee7b7' } }, String(p.wins)),
            h('div', { style: { fontSize: 12, color: '#6ee7b7' } }, 'נצחונות')),
          h('div', { style: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '4px 10px', borderRadius: 8, background: 'rgba(148,163,184,0.15)',
          } },
            h('div', { style: { fontSize: 22, fontWeight: 900, color: INK } }, String(p.appearances)),
            h('div', { style: { fontSize: 12, color: MUTED } }, 'הופעות'))));
    };

    return new ImageResponse(
      h('div', { style: {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: BG, padding: 40, alignItems: 'center', justifyContent: 'center',
      } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 } },
          h('div', { style: { fontSize: 46 } }, '🏆'),
          h('div', { style: { fontSize: 52, fontWeight: 900, color: GOLD } }, `נבחרת ${monthName}`)),
        h('div', { style: { display: 'flex', gap: 16 } }, squad.map(card))),
      { width: 1200, height: 480 }
    );
  } catch (err) {
    // A broken image must never break the push — the sender treats a non-200
    // as "no image" and the text-only notification still goes out.
    return new Response(`image failed: ${err?.message}`, { status: 500 });
  }
}
