// Deterministic seeding + the shared America/New_York daily clock.
// Krillion resets at midnight New York for everyone, regardless of the
// player's own device timezone, so "today" is always computed in NY time.

function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

// mulberry32 PRNG seeded with a 32-bit int
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seedStr) {
  const seedFn = hashString(seedStr);
  const seed = seedFn();
  return mulberry32(seed);
}

// Deterministically pick `count` items from array (no replacement), seeded.
function seededPick(array, count, seedStr) {
  const rng = makeRng(seedStr);
  const pool = array.slice();
  const picked = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

const NY_TZ = "America/New_York";

function nyParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  return parts;
}

// Today's date (YYYY-MM-DD) in America/New_York, not the device's local date.
function todayDateString(date = new Date()) {
  const p = nyParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

// Milliseconds until the next midnight in America/New_York.
function msUntilNextReset(date = new Date()) {
  const p = nyParts(date);
  const secondsSinceMidnight = Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second);
  const msSinceMidnight = secondsSinceMidnight * 1000 + date.getMilliseconds();
  return 24 * 60 * 60 * 1000 - msSinceMidnight;
}

// "Xh Ym" style countdown text.
function formatCountdown(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

window.TopBinsSeed = { seededPick, todayDateString, makeRng, msUntilNextReset, formatCountdown };
