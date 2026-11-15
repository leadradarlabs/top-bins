// Wordle-style shareable score card.

const TIER_EMOJI = {
  0: "⬛", // miss / timeout
  10: "⬜", // Tap-In
  25: "🟦", // Placed Finish
  50: "🟨", // Curler
  70: "🟧", // Volley
  85: "🟥", // Screamer
  100: "🟩", // Top Bins
};

const MODE_LABEL = {
  "deep-cut": "Deep Cut",
  transfer: "Transfer Window",
};

function modeLabel(modeKey) {
  if (MODE_LABEL[modeKey]) return MODE_LABEL[modeKey];
  if (modeKey.startsWith("club:")) {
    const club = modeKey.split(":")[1];
    return club.charAt(0).toUpperCase() + club.slice(1) + " Edition";
  }
  return modeKey;
}

function buildShareCard({ modeKey, dateStr, pointsSequence, totalScore, maxScore, streak }) {
  const squares = pointsSequence.map((p) => TIER_EMOJI[p] || "⬛").join("");
  const lines = [
    `TOP BINS — ${modeLabel(modeKey)} (${dateStr})`,
    squares,
    `${totalScore}/${maxScore}`,
  ];
  if (streak && streak > 1) lines.push(`🔥 ${streak} day streak`);
  lines.push("Name the obscure one → topbins.app");
  return lines.join("\n");
}

async function copyShareCard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

window.TopBinsShare = { buildShareCard, copyShareCard, TIER_EMOJI };
