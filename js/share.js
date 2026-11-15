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

function buildShareCard({ dateStr, pointsSequence, totalScore, maxScore, streak }) {
  const squares = pointsSequence.map((p) => TIER_EMOJI[p] || "⬛").join("");
  const lines = [
    `DEEP CUTS (${dateStr})`,
    squares,
    `${totalScore}/${maxScore}`,
  ];
  if (streak && streak > 1) lines.push(`🔥 ${streak} day streak`);
  lines.push("Name the obscure one → deepcuts.app");
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
