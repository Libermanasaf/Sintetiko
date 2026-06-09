// Server-bound input validation, applied in the write layer (storage.js /
// entities.js) so EVERY insert/update is covered in one place — regardless of
// which screen called it.
//
// What this defends against:
//  - Oversized payloads (spam / egress abuse): per-field max lengths.
//  - Control chars / null bytes that can corrupt storage or break rendering.
// What it deliberately does NOT do:
//  - Strip HTML/quotes. React escapes on render and PostgREST parameterizes
//    queries, so stored "<b>" is inert text. Over-stripping would reject
//    legitimate names. We neutralize the dangerous bytes, not the content.

// Max characters allowed per text column. Anything not listed is left as-is.
const MAX_LEN = {
  name: 80,
  player_name: 80,
  note: 300,
  user_email: 160,
  email: 160,
  header: 80,
};

// Remove C0 control chars (0x00-0x1F) except tab(09)/newline(0A)/CR(0D),
// DEL (0x7F), and C1 controls (0x80-0x9F). These have no place in user text and
// can break DB storage or rendering. Built via RegExp(string) so the source
// stays plain ASCII and never embeds invisible control bytes.
const CONTROL_CHARS = new RegExp(
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]',
  'g'
);

function stripControl(s) {
  return s.replace(CONTROL_CHARS, '');
}

// Clean a single value if it's a string we recognize; pass everything else
// (numbers, jsonb objects, arrays, booleans) through untouched.
function cleanField(key, value) {
  if (typeof value !== 'string') return value;
  let v = stripControl(value).trim();
  const max = MAX_LEN[key];
  if (max && v.length > max) v = v.slice(0, max);
  return v;
}

// Sanitize a row object before it's written. Returns a new object; never mutates.
export function sanitizeRow(data) {
  if (!data || typeof data !== 'object') return data;
  const out = {};
  for (const [k, v] of Object.entries(data)) out[k] = cleanField(k, v);
  return out;
}
