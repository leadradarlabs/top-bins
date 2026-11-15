(function () {
  const screens = {};
  document.querySelectorAll(".screen").forEach((el) => (screens[el.id] = el));

  function showScreen(id) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[id].classList.add("active");
  }

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      showScreen("screen-home");
      renderHomeState();
    });
  });

  let pack = null;
  async function loadPack() {
    if (pack) return pack;
    const res = await fetch("prompts/deep-cut.json");
    if (!res.ok) throw new Error("Failed to load prompts/deep-cut.json");
    pack = await res.json();
    return pack;
  }

  // ---------- Count-up animation ----------

  function animateCount(el, from, to, duration = 700) {
    if (from === to) {
      el.textContent = to;
      return;
    }
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = Math.round(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------- Rating bands ----------

  const RATING_BANDS = [
    { max: 99, label: "Sunday League" },
    { max: 249, label: "Academy Prospect" },
    { max: 399, label: "First-Team Regular" },
    { max: 549, label: "Club Legend" },
    { max: 649, label: "Hall of Famer" },
    { max: Infinity, label: "Top Bins Merchant" },
  ];
  function ratingBand(score) {
    return RATING_BANDS.find((b) => score <= b.max).label;
  }

  // ---------- Scheduler (shared America/New_York midnight reset) ----------

  const MODE_KEY = "deep-cut";
  let DATE_STR = window.TopBinsSeed.todayDateString();

  function renderHomeState() {
    document.getElementById("stat-streak").textContent = window.TopBinsStorage.getStreak();
    document.getElementById("stat-best").textContent = window.TopBinsStorage.getBest(MODE_KEY);

    const playBtn = document.getElementById("btn-play");
    const countdownEl = document.getElementById("home-countdown");
    const played = window.TopBinsStorage.hasPlayedToday(MODE_KEY, DATE_STR);
    playBtn.hidden = played;
    countdownEl.hidden = !played;
    if (played) {
      const detail = window.TopBinsStorage.getResultForDate(MODE_KEY, DATE_STR);
      countdownEl.innerHTML = `Today's Deep Cuts: <strong>${detail.score}/${detail.maxScore}</strong><br>Next one in <strong id="home-countdown-time"></strong>`;
    }
  }

  function updateCountdownTexts() {
    const ms = window.TopBinsSeed.msUntilNextReset();
    const text = window.TopBinsSeed.formatCountdown(ms);
    const homeTime = document.getElementById("home-countdown-time");
    if (homeTime) homeTime.textContent = text;
    const resultsCountdown = document.getElementById("results-countdown");
    if (resultsCountdown && screens["screen-results"].classList.contains("active")) {
      resultsCountdown.innerHTML = `Next Deep Cuts in <strong>${text}</strong>`;
    }
  }

  function checkClock() {
    const nowDateStr = window.TopBinsSeed.todayDateString();
    if (nowDateStr !== DATE_STR) {
      // Midnight passed while the page was open: roll over to the new day.
      DATE_STR = nowDateStr;
      activeGame = null;
      showScreen("screen-home");
      renderHomeState();
    } else {
      updateCountdownTexts();
    }
  }

  setInterval(checkClock, 20000);
  setTimeout(checkClock, window.TopBinsSeed.msUntilNextReset() + 1000);

  // ---------- Game flow ----------

  let activeGame = null;

  async function startDeepCut() {
    if (window.TopBinsStorage.hasPlayedToday(MODE_KEY, DATE_STR)) {
      showResultsFromStorage();
      return;
    }
    const p = await loadPack();
    const todays = window.TopBinsSeed.seededPick(p.prompts, 7, `deep-cut:${DATE_STR}`);
    launchGame(todays);
  }

  function launchGame(prompts) {
    document.getElementById("running-max").textContent = prompts.length * 100;
    buildProgressDots(prompts.length);
    setMeter(0, prompts.length * 100);

    activeGame = new window.TopBinsGame(prompts, {
      promptStart: onPromptStart,
      previewStart: onPreviewStart,
      timerStart: onTimerStart,
      tick: onTick,
      wrongGuess: onWrongGuess,
      scored: onScored,
      gameEnd: onGameEnd,
    });

    showScreen("screen-game");
    document.getElementById("guess-input").value = "";
    document.getElementById("feedback").textContent = "";
    document.getElementById("running-score").textContent = "0";
    activeGame.start();
  }

  function buildProgressDots(n) {
    const wrap = document.getElementById("progress-dots");
    wrap.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div");
      d.className = "dot";
      wrap.appendChild(d);
    }
  }

  function updateProgressDots(currentIndex) {
    const dots = document.querySelectorAll("#progress-dots .dot");
    dots.forEach((dot, i) => {
      dot.classList.remove("done", "current");
      if (i < currentIndex) dot.classList.add("done");
      else if (i === currentIndex) dot.classList.add("current");
    });
  }

  function setMeter(score, maxScore) {
    const pct = maxScore === 0 ? 0 : Math.max(0, Math.min(100, (score / maxScore) * 100));
    document.getElementById("meter-fill").style.height = `${pct}%`;
    document.getElementById("meter-ball").style.bottom = `${pct}%`;
  }

  const CIRCUMFERENCE = 2 * Math.PI * 40;
  let previewIntervalId = null;

  function onPromptStart({ index, prompt }) {
    updateProgressDots(index);
    document.getElementById("prompt-text").textContent = prompt.text;
    document.getElementById("feedback").textContent = "";
    document.getElementById("guess-input").value = "";
    const input = document.getElementById("guess-input");
    input.disabled = true;
  }

  function onPreviewStart({ duration }) {
    const ring = document.getElementById("timer-ring");
    const badge = document.getElementById("preview-badge");
    ring.classList.add("previewing");
    ring.classList.remove("urgent");
    let remaining = duration;
    badge.textContent = remaining;
    clearInterval(previewIntervalId);
    previewIntervalId = setInterval(() => {
      remaining--;
      if (remaining > 0) badge.textContent = remaining;
      else clearInterval(previewIntervalId);
    }, 1000);
  }

  function onTimerStart() {
    clearInterval(previewIntervalId);
    document.getElementById("timer-ring").classList.remove("previewing");
    const input = document.getElementById("guess-input");
    input.disabled = false;
    input.focus();
    const circle = document.getElementById("timer-circle");
    circle.style.strokeDasharray = `${CIRCUMFERENCE}`;
    circle.style.strokeDashoffset = "0";
  }

  function onTick(secondsLeft) {
    document.getElementById("timer-seconds").textContent = Math.max(0, secondsLeft);
    const circle = document.getElementById("timer-circle");
    const frac = Math.max(0, secondsLeft) / window.TOP_BINS_PROMPT_SECONDS;
    circle.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - frac)}`;
    document.getElementById("timer-ring").classList.toggle("urgent", secondsLeft <= 7);
  }

  function onWrongGuess({ penalty }) {
    const fb = document.getElementById("feedback");
    fb.textContent = `Not on the sheet — keep going (-${penalty}s).`;
    document.getElementById("guess-input").value = "";
    document.getElementById("guess-input").focus();
  }

  function onScored({ result, totalScore }) {
    const previousTotal = totalScore - result.points;
    showTierReveal(result, () => {
      animateCount(document.getElementById("running-score"), previousTotal, totalScore);
      activeGame.advance();
    });
    setMeter(totalScore, activeGame.maxScore);
  }

  function showTierReveal(result, onDone) {
    const overlay = document.getElementById("tier-reveal");
    const nameEl = document.getElementById("reveal-name");
    const pointsEl = document.getElementById("reveal-points");
    const answerEl = document.getElementById("reveal-answer");

    nameEl.textContent = result.tierName;
    nameEl.className = `tier-name tier-${result.points}`;
    pointsEl.textContent = `+${result.points} points`;
    pointsEl.className = `tier-points tier-${result.points}`;
    answerEl.textContent = result.timedOut ? "Time's up." : `Matched: ${result.matchedName}`;

    nameEl.style.animation = "none";
    pointsEl.style.animation = "none";
    answerEl.style.animation = "none";
    requestAnimationFrame(() => {
      nameEl.style.animation = "";
      pointsEl.style.animation = "";
      answerEl.style.animation = "";
    });

    overlay.classList.add("active");
    setTimeout(() => {
      overlay.classList.remove("active");
      onDone();
    }, 1600);
  }

  function onGameEnd({ totalScore, maxScore, tierBreakdown, pointsSequence }) {
    const detail = { score: totalScore, maxScore, pointsSequence, tierBreakdown };
    const store = window.TopBinsStorage.recordResult(MODE_KEY, DATE_STR, detail);
    renderResults(detail, store.streak);
  }

  function showResultsFromStorage() {
    const detail = window.TopBinsStorage.getResultForDate(MODE_KEY, DATE_STR);
    renderResults(detail, window.TopBinsStorage.getStreak(), true);
  }

  function renderResults(detail, streak, skipAnimation) {
    document.getElementById("final-max").textContent = detail.maxScore;
    document.getElementById("rating-band").textContent = ratingBand(detail.score);
    renderTierBreakdown(detail.tierBreakdown);

    document.getElementById("results-streak").textContent = streak || 0;
    document.getElementById("results-best").textContent = window.TopBinsStorage.getBest(MODE_KEY);
    document.getElementById("results-countdown").innerHTML =
      `Next Deep Cuts in <strong>${window.TopBinsSeed.formatCountdown(window.TopBinsSeed.msUntilNextReset())}</strong>`;

    const shareText = window.TopBinsShare.buildShareCard({
      dateStr: DATE_STR,
      pointsSequence: detail.pointsSequence,
      totalScore: detail.score,
      maxScore: detail.maxScore,
      streak,
    });

    const shareBtn = document.getElementById("btn-share");
    shareBtn.onclick = async () => {
      const ok = await window.TopBinsShare.copyShareCard(shareText);
      shareBtn.textContent = ok ? "Copied!" : "Copy failed — long-press to copy";
      setTimeout(() => (shareBtn.textContent = "Copy share card"), 1800);
    };

    showScreen("screen-results");

    const finalScoreEl = document.getElementById("final-score");
    if (skipAnimation) {
      finalScoreEl.textContent = detail.score;
    } else {
      finalScoreEl.textContent = "0";
      setTimeout(() => animateCount(finalScoreEl, 0, detail.score, 1000), 150);
    }
  }

  const TIER_ORDER = [100, 85, 70, 50, 25, 10, 0];
  function renderTierBreakdown(breakdown) {
    const wrap = document.getElementById("tier-breakdown");
    wrap.innerHTML = "";
    TIER_ORDER.forEach((tier) => {
      const count = breakdown[tier] || 0;
      if (count === 0 && tier !== 0) return;
      const row = document.createElement("div");
      row.className = "tier-row";
      const label = window.TopBinsTierNames[tier];
      row.innerHTML = `<span class="tier-${tier}">${label}</span><span class="count">${count}</span>`;
      wrap.appendChild(row);
    });
  }

  // ---------- Wiring ----------

  document.getElementById("btn-play").addEventListener("click", startDeepCut);

  document.getElementById("guess-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("guess-input");
    const text = input.value.trim();
    if (!text || !activeGame || input.disabled) return;
    activeGame.submitGuess(text);
    input.value = "";
  });

  renderHomeState();
})();
