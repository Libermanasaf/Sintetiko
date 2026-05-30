import { getSupabaseAdmin } from './_supabaseAdmin.js';

const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel env' });
  }

  const { roundId, date, teams, teamWins, winningTeam, playerGoals, playerNames } = req.body || {};
  if (!roundId || !Array.isArray(teams)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const dateStr = new Date(date).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const teamsBlock = teams.map((playerIds, idx) => {
    const name = TEAM_NAMES[idx] || `קבוצה ${idx + 1}`;
    const wins = teamWins?.[idx] ?? 0;
    const roster = playerIds.map(pid => playerNames?.[pid] || 'שחקן').join(', ');
    return `${name} — ${wins} ניצחונות | ${roster}`;
  }).join('\n');

  const winnerName = winningTeam !== null && winningTeam !== undefined
    ? (TEAM_NAMES[winningTeam] || `קבוצה ${winningTeam + 1}`)
    : 'תיקו';

  const goalsEntries = Object.entries(playerGoals || {})
    .filter(([, g]) => g > 0)
    .sort(([, a], [, b]) => b - a);

  const goalsBlock = goalsEntries.length
    ? goalsEntries.map(([pid, g]) => `${playerNames?.[pid] || 'שחקן'}: ${g} ${g === 1 ? 'גול' : 'גולים'}`).join(', ')
    : 'לא נרשמו גולים במשחק זה';

  const prompt = `אתה כרוניקאי ספורט של סינטסיקו חולון — ליגת כדורגל עירונית.
כתוב סיכום ספורטיבי ומלהיב בעברית על המשחק הבא. 3-4 משפטים. כתוב בגוף שלישי. ללא כותרות.

תאריך: ${dateStr}
קבוצות ותוצאות:
${teamsBlock}
מנצחת: ${winnerName}
כובשים: ${goalsBlock}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || `Claude error ${response.status}` });
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text?.trim() || '';

    // Try to persist — column ai_summary must exist in rounds table
    if (summary) {
      try {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          await supabase.from('rounds').update({ ai_summary: summary }).eq('id', roundId);
        }
      } catch {
        // Silently ignore if column doesn't exist yet
      }
    }

    return res.status(200).json({ summary });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
