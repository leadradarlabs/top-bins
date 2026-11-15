// Normalize + fuzzy match for typed player/club/manager names.

function normalizeName(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // strip punctuation
    .replace(/\s+/g, " ")
    .trim();
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

// Returns the matching answer object from `answers` if the guess matches
// within edit distance <= 2 of the normalized full name, else null.
function matchAnswer(guess, answers) {
  const g = normalizeName(guess);
  if (!g) return null;
  let best = null;
  let bestDist = Infinity;
  for (const ans of answers) {
    const candidates = [ans.name, ...(ans.aliases || [])];
    for (const cand of candidates) {
      const n = normalizeName(cand);
      const maxLen = Math.max(g.length, n.length);
      // Skip absurd length mismatches early (cheap guard, not a correctness rule).
      if (Math.abs(g.length - n.length) > 2 && maxLen > 4) continue;
      const dist = editDistance(g, n);
      if (dist <= 2 && dist < bestDist) {
        bestDist = dist;
        best = ans;
      }
    }
  }
  return best;
}

window.TopBinsFuzzy = { normalizeName, editDistance, matchAnswer };
