// Forgiving Hebrew search: normalize so small spelling variations still match.
// Kept conservative so it doesn't create wrong matches:
// - strip spaces, geresh/gershayim, quotes and niqqud
// - fold the "silent"/interchangeable matres lectionis א/ע/ה and ו/י that people
//   add or drop (ראאם/ראם, יוסי/יוסף-start, שמעון/שימעון)
// - collapse consecutive duplicate letters (ראאם → ראם) so a single vs double
//   letter doesn't matter
// Example: "ראם" and "ראאם כהן" both normalize to a common prefix, so typing
// "ראם" (or "ראאם") finds "ראאם כהן".
export function normalizeHebrew(s = '') {
  return s
    .toLowerCase()
    .replace(/[֑-ׇ'"׳״\s]/g, '') // niqqud, geresh/gershayim, quotes, spaces
    .replace(/[אעה]/g, 'א')      // silent/interchangeable gutturals
    .replace(/[וי]/g, 'ו')       // vav/yod as vowels people add or drop
    .replace(/(.)\1+/g, '$1');   // collapse consecutive duplicates
}

// Match on either the raw substring (fast, exact) OR the forgiving normalized
// form, so "ראם" finds "ראאם כהן" while normal typing still works as expected.
export function nameMatches(name = '', query = '') {
  const q = query.trim();
  if (!q) return true;
  return name.toLowerCase().includes(q.toLowerCase()) ||
    normalizeHebrew(name).includes(normalizeHebrew(q));
}
