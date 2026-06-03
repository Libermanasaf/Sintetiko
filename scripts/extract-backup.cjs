// Extracts the full-DB backup JSON from a saved MCP tool-result file (Node port
// of the python approach: let JSON.parse handle all unescaping). One-off helper.
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const raw = fs.readFileSync(src, 'utf8');

// Outer wrapper produced by the harness: {"result":"<text>"} — parse to get the
// inner text with all escaping resolved by the JSON parser itself.
const outer = JSON.parse(raw);
const result = outer.result;

// The SQL row array lives inside the untrusted-data boundary: [{"full_backup":...}]
const i = result.indexOf('[{');
const arr = result.slice(i, result.lastIndexOf('}]') + 2);
const rows = JSON.parse(arr);

let backup = rows[0].full_backup;
if (typeof backup === 'string') backup = JSON.parse(backup);

const counts = Object.fromEntries(
  Object.entries(backup.data).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
);
console.log('rows per table:', JSON.stringify(counts));

const dir = path.join(__dirname, '../backups');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
const out = path.join(dir, `sintetiko-FULL-backup-${stamp}.json`);
fs.writeFileSync(out, JSON.stringify(backup, null, 2), 'utf8');
console.log('saved:', out, `(${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB)`);
