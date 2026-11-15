// Normalize + fuzzy match for typed last names, plus autocomplete filtering.

function normalizeName(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // strip punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// Last name = last whitespace-separated token of the name, as given.
function lastNameOf(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

// Standard Levenshtein edit distance.
function editDistance(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Matches the typed text against each answer's LAST NAME only (edit distance <= 2).
// The guess's own last token is used, so typing a full name still works.
function matchAnswer(guess, answers) {
  const g = normalizeName(lastNameOf(guess));
  if (!g) return null;
  let best = null;
  let bestDist = Infinity;
  for (const ans of answers) {
    const n = normalizeName(lastNameOf(ans.name));
    const maxLen = Math.max(g.length, n.length);
    if (Math.abs(g.length - n.length) > 2 && maxLen > 4) continue;
    const dist = editDistance(g, n);
    if (dist <= 2 && dist < bestDist) {
      bestDist = dist;
      best = ans;
    }
  }
  return best;
}

// Autocomplete candidates: answers whose last name contains the typed text so far.
function filterSuggestions(query, answers, limit = 5) {
  const q = normalizeName(query);
  if (!q) return [];
  return answers
    .filter((a) => normalizeName(lastNameOf(a.name)).includes(q))
    .slice(0, limit);
}

window.TopBinsFuzzy = { normalizeName, lastNameOf, editDistance, matchAnswer, filterSuggestions };
