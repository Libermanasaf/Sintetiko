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

    return new ImageResponse(
      (
        <div style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          background: BG, padding: 40, alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ fontSize: 46 }}>🏆</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: GOLD }}>
              נבחרת {monthName}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            {squad.map((p, i) => {
              const img = imageById.get(p.id);
              return (
                <div key={p.id} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  width: 168, padding: 16, borderRadius: 20,
                  background: 'linear-gradient(180deg,#1e293b,#0b1220)',
                  border: `2px solid ${i === 0 ? GOLD : '#334155'}`,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 8, background: GOLD,
                    color: '#0a0f1a', fontSize: 20, fontWeight: 900, marginBottom: 10,
                  }}>{i + 1}</div>

                  {img ? (
                    <img src={img} width={92} height={92}
                      style={{ borderRadius: 18, objectFit: 'cover', border: `3px solid ${GOLD}` }} />
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 92, height: 92, borderRadius: 18, background: '#334155',
                      border: `3px solid ${GOLD}`, fontSize: 40, color: MUTED,
                    }}>{(p.name || '?').charAt(0)}</div>
                  )}

                  <div style={{
                    fontSize: 22, fontWeight: 900, color: INK, marginTop: 12,
                    maxWidth: 150, overflow: 'hidden', whiteSpace: 'nowrap',
                  }}>{p.name}</div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.15)',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#6ee7b7' }}>{p.wins}</div>
                      <div style={{ fontSize: 12, color: '#6ee7b7' }}>נצחונות</div>
                    </div>
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '4px 10px', borderRadius: 8, background: 'rgba(148,163,184,0.15)',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: INK }}>{p.appearances}</div>
                      <div style={{ fontSize: 12, color: MUTED }}>הופעות</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
      { width: 1200, height: 480 }
    );
  } catch (err) {
    // A broken image must never break the push — the sender treats a non-200
    // as "no image" and the text-only notification still goes out.
    return new Response(`image failed: ${err?.message}`, { status: 500 });
  }
}
