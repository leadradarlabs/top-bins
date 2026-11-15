// localStorage-only persistence: streaks + best scores. No accounts.

const STORE_KEY = "topbins:v1";

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveStore(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (e) {
    /* storage unavailable (private mode etc) — fail silently */
  }
}

// modeKey is always "deep-cut" (single-mode game), kept as a param for clarity.
function recordResult(modeKey, dateStr, score) {
  const store = loadStore();
  store.results = store.results || {};
  store.results[modeKey] = store.results[modeKey] || {};
  store.results[modeKey][dateStr] = score;

  store.best = store.best || {};
  store.best[modeKey] = Math.max(store.best[modeKey] || 0, score);

  // Streak: consecutive days (by calendar date) with a played Deep Cut result.
  if (modeKey === "deep-cut") {
    store.streak = computeStreak(store.results["deep-cut"], dateStr);
  }

  saveStore(store);
  return store;
}

function computeStreak(resultsByDate, todayStr) {
  if (!resultsByDate) return 1;
  let streak = 0;
  let cursor = new Date(todayStr + "T00:00:00");
  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    if (resultsByDate[key] !== undefined) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function hasPlayedToday(modeKey, dateStr) {
  const store = loadStore();
  return !!(store.results && store.results[modeKey] && store.results[modeKey][dateStr] !== undefined);
}

function getBest(modeKey) {
  const store = loadStore();
  return (store.best && store.best[modeKey]) || 0;
}

function getStreak() {
  const store = loadStore();
  return store.streak || 0;
}

window.TopBinsStorage = { loadStore, saveStore, recordResult, hasPlayedToday, getBest, getStreak };
