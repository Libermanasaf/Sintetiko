import { getSupabaseAdmin, getCallerUser, isAdminUser } from './_supabaseAdmin.js';

// Turns the coach's free-text round instructions into structured constraints
// the team-balancing algorithm can honor:
//   pins      — player must be on a specific team (0=yellow, 1=blue, 2=orange)
//   together  — pair must share a team
//   apart     — pair must NOT share a team
//   openingTeams / openingPlayerIds — who plays the opening match
// Parsed by Claude Haiku against the actual roster (ids+names), so fuzzy
// Hebrew name matching happens in the model, not in brittle regex.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel env' });
  }

  // Admin-only: it's an admin tool and every call costs API tokens.
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const caller = await getCallerUser(req, supabase);
    if (!caller || !isAdminUser(caller)) {
      return res.status(403).json({ error: 'רק מנהל יכול לפרש הוראות מחזור' });
    }
  }

  const { text, players, numTeams } = req.body || {};
  if (!text?.trim() || !Array.isArray(players) || players.length === 0) {
    return res.status(400).json({ error: 'Missing text/players' });
  }

  const teamCount = Math.min(Math.max(Number(numTeams) || 3, 2), 3);
  const roster = players.map((p) => `${p.id} | ${p.name}`).join('\n');
  const teamNames = ['הצהובים (0)', 'הכחולים (1)', 'הכתומים (2)'].slice(0, teamCount).join(', ');

  const prompt = `אתה מפרש הוראות של מאמן לחלוקת קבוצות כדורגל. החזר JSON בלבד — בלי הסברים ובלי code fences.

הקבוצות במחזור: ${teamNames}.
רשימת השחקנים (id | שם):
${roster}

הוראות המאמן:
"""${text.trim()}"""

החזר אובייקט JSON במבנה הזה בדיוק:
{
  "pins": [{"playerId": "<id מהרשימה>", "team": <0-${teamCount - 1}>}],
  "avoid": [{"playerId": "<id מהרשימה>", "team": <0-${teamCount - 1}>}],
  "together": [["<id>","<id>"]],
  "apart": [["<id>","<id>"]],
  "openingTeams": [<אינדקס>, <אינדקס>] או null,
  "openingPlayerIds": ["<id>"],
  "summary": "<משפט קצר בעברית שמסכם מה הבנת>",
  "unclear": ["<הוראה שלא פוענחה או שם שלא נמצא ברשימה>"]
}

כללים:
- השתמש אך ורק ב-id-ים מהרשימה. התאם שמות בגמישות (שם פרטי, כינוי, שגיאת כתיב קלה) — אך אם שם מתאים לשני שחקנים, אל תנחש: שים את ההוראה ב-unclear.
- "ייצא צהוב" / "בצהובים" = pin לקבוצה 0. כחול = 1, כתום = 2.
- "לא ייצא כתום" / "שלא יהיה בכתומים" = avoid (הקבוצה שאסור לו להיות בה). הוראה שלילית היא avoid, לא pin.
- "X ו-Y ביחד" = together. "להפריד את X ו-Y" / "שלא יהיו באותה קבוצה" = apart.
- "המשחק הפותח צהובים נגד כתומים" = openingTeams [0,2]. "שX יפתח" = openingPlayerIds.
- הוראה שאינה קשורה לחלוקת כוחות — ל-unclear.
- אם אין הוראות רלוונטיות: מערכים ריקים ו-openingTeams null.`;

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
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || `Claude error ${response.status}` });
    }

    const data = await response.json();
    let raw = data.content?.[0]?.text?.trim() || '';
    raw = raw.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'פירוש ההוראות נכשל — נסה לנסח מחדש' });
    }

    // Sanitize hard: only roster ids, only valid team indexes.
    const ids = new Set(players.map((p) => String(p.id)));
    const okTeam = (t) => Number.isInteger(t) && t >= 0 && t < teamCount;
    const pins = (Array.isArray(parsed.pins) ? parsed.pins : [])
      .filter((p) => p && ids.has(String(p.playerId)) && okTeam(p.team))
      .map((p) => ({ playerId: String(p.playerId), team: p.team }));
    const avoid = (Array.isArray(parsed.avoid) ? parsed.avoid : [])
      .filter((p) => p && ids.has(String(p.playerId)) && okTeam(p.team))
      .map((p) => ({ playerId: String(p.playerId), team: p.team }));
    const pairs = (arr) => (Array.isArray(arr) ? arr : [])
      .filter((pr) => Array.isArray(pr) && pr.length === 2
        && ids.has(String(pr[0])) && ids.has(String(pr[1])) && String(pr[0]) !== String(pr[1]))
      .map((pr) => [String(pr[0]), String(pr[1])]);
    const openingTeams = Array.isArray(parsed.openingTeams) && parsed.openingTeams.length === 2
      && okTeam(parsed.openingTeams[0]) && okTeam(parsed.openingTeams[1])
      && parsed.openingTeams[0] !== parsed.openingTeams[1]
      ? [parsed.openingTeams[0], parsed.openingTeams[1]]
      : null;
    const openingPlayerIds = (Array.isArray(parsed.openingPlayerIds) ? parsed.openingPlayerIds : [])
      .filter((id) => ids.has(String(id)))
      .map(String);

    return res.status(200).json({
      pins,
      avoid,
      together: pairs(parsed.together),
      apart: pairs(parsed.apart),
      openingTeams,
      openingPlayerIds,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      unclear: Array.isArray(parsed.unclear) ? parsed.unclear.filter((u) => typeof u === 'string') : [],
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
