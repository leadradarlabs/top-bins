// Transfer Window mode availability: Jan 1-31, and Jun 10-Sep 1 each year.

function isTransferWindowOpen(date = new Date()) {
  const m = date.getMonth(); // 0-indexed
  const d = date.getDate();
  if (m === 0) return true; // January, any day
  if (m === 5 && d >= 10) return true; // Jun 10+
  if (m === 6 || m === 7) return true; // Jul, Aug
  if (m === 8 && d <= 1) return true; // Sep 1
  return false;
}

// Next window-open date, for the off-season countdown.
function nextWindowOpenDate(date = new Date()) {
  const year = date.getFullYear();
  const candidates = [
    new Date(year, 0, 1), // Jan 1 this year
    new Date(year, 5, 10), // Jun 10 this year
    new Date(year + 1, 0, 1), // Jan 1 next year
  ];
  for (const c of candidates) {
    if (c > date) return c;
  }
  return candidates[candidates.length - 1];
}

function daysUntil(targetDate, fromDate = new Date()) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const a = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const b = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  return Math.round((b - a) / msPerDay);
}

window.TopBinsWindows = { isTransferWindowOpen, nextWindowOpenDate, daysUntil };
