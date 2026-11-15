(function () {
  const CLUBS = [
    { slug: "arsenal", name: "Arsenal" },
    { slug: "chelsea", name: "Chelsea" },
    { slug: "liverpool", name: "Liverpool" },
    { slug: "mancity", name: "Man City" },
    { slug: "manutd", name: "Man Utd" },
    { slug: "tottenham", name: "Tottenham" },
  ];

  const screens = {};
  document.querySelectorAll(".screen").forEach((el) => (screens[el.id] = el));

  function showScreen(id) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[id].classList.add("active");
  }

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen("screen-home"));
  });

  async function loadPack(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  function renderHomeStats() {
    document.getElementById("stat-streak").textContent = window.TopBinsStorage.getStreak();
    document.getElementById("stat-best").textContent = window.TopBinsStorage.getBest("deep-cut");
  }

  function renderTransferHomeCard() {
    const open = window.TopBinsWindows.isTransferWindowOpen();
    const pill = document.getElementById("transfer-pill");
    const sub = document.getElementById("transfer-sub");
    if (open) {
      pill.textContent = "Live";
      pill.classList.remove("off");
      sub.textContent = "7 prompts about transfers only.";
    } else {
      pill.textContent = "Closed";
      pill.classList.add("off");
      const days = window.TopBinsWindows.daysUntil(window.TopBinsWindows.nextWindowOpenDate());
      sub.textContent = `Reopens in ${days} day${days === 1 ? "" : "s"}.`;
    }
  }

  function renderClubGrid() {
    const grid = document.getElementById("club-grid");
    grid.innerHTML = "";
    CLUBS.forEach((club) => {
      const btn = document.createElement("button");
      btn.className = "club-btn";
      btn.textContent = club.name;
      btn.addEventListener("click", () => startClubMode(club));
      grid.appendChild(btn);
    });
  }

  // ---------- Game flow ----------

  let activeGame = null;
  let activeModeKey = null;
  let activeModeLabel = null;
  let activeDateStr = null;

  async function startDeepCut() {
    const pack = await loadPack("prompts/deep-cut.json");
    const dateStr = window.TopBinsSeed.todayDateString();
    const todays = window.TopBinsSeed.seededPick(pack.prompts, 7, `deep-cut:${dateStr}`);
    launchGame(todays, "deep-cut", "Deep Cut", dateStr);
  }

  async function startClubMode(club) {
    const pack = await loadPack(`prompts/club-${club.slug}.json`);
    const dateStr = window.TopBinsSeed.todayDateString();
    const todays = window.TopBinsSeed.seededPick(pack.prompts, 7, `club:${club.slug}:${dateStr}`);
    launchGame(todays, `club:${club.slug}`, `${club.name} Edition`, dateStr);
  }

  async function startTransferMode() {
    if (!window.TopBinsWindows.isTransferWindowOpen()) {
      const days = window.TopBinsWindows.daysUntil(window.TopBinsWindows.nextWindowOpenDate());
      document.getElementById("countdown-days").textContent = days;
      showScreen("screen-transfer-closed");
      return;
    }
    const pack = await loadPack("prompts/transfer.json");
    const dateStr = window.TopBinsSeed.todayDateString();
    const todays = window.TopBinsSeed.seededPick(pack.prompts, 7, `transfer:${dateStr}`);
    launchGame(todays, "transfer", "Transfer Window", dateStr);
  }

  function launchGame(prompts, modeKey, modeLabel, dateStr) {
    activeModeKey = modeKey;
    activeModeLabel = modeLabel;
    activeDateStr = dateStr;

    document.getElementById("game-mode-label").textContent = modeLabel;
    document.getElementById("running-max").textContent = prompts.length * 100;
    buildProgressDots(prompts.length);

    activeGame = new window.TopBinsGame(prompts, {
      promptStart: onPromptStart,
      tick: onTick,
      wrongGuess: onWrongGuess,
      scored: onScored,
      gameEnd: onGameEnd,
    });

    showScreen("screen-game");
    document.getElementById("guess-input").value = "";
    document.getElementById("feedback").textContent = "";
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

  const CIRCUMFERENCE = 2 * Math.PI * 40;

  function onPromptStart({ index, prompt }) {
    updateProgressDots(index);
    document.getElementById("prompt-text").textContent = prompt.text;
    document.getElementById("feedback").textContent = "";
    document.getElementById("guess-input").value = "";
    document.getElementById("guess-input").focus();
    const circle = document.getElementById("timer-circle");
    circle.style.strokeDasharray = `${CIRCUMFERENCE}`;
    circle.style.strokeDashoffset = "0";
    document.getElementById("timer-ring").classList.remove("urgent");
  }

  function onTick(secondsLeft) {
    document.getElementById("timer-seconds").textContent = Math.max(0, secondsLeft);
    const circle = document.getElementById("timer-circle");
    const frac = Math.max(0, secondsLeft) / window.TOP_BINS_PROMPT_SECONDS;
    circle.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - frac)}`;
    document.getElementById("timer-ring").classList.toggle("urgent", secondsLeft <= 7);
  }

  function onWrongGuess() {
    const fb = document.getElementById("feedback");
    fb.textContent = "Not on the sheet — keep going.";
    document.getElementById("guess-input").value = "";
    document.getElementById("guess-input").focus();
  }

  function onScored({ result }) {
    showTierReveal(result, () => {
      document.getElementById("running-score").textContent = activeGame.totalScore;
      activeGame.advance();
    });
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
    answerEl.textContent = result.timedOut
      ? "Time's up."
      : `"${result.matchedName}"`;

    // restart animations
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
    }, 1500);
  }

  function onGameEnd({ totalScore, maxScore, tierBreakdown, pointsSequence }) {
    document.getElementById("final-score").textContent = totalScore;
    document.getElementById("final-max").textContent = maxScore;

    const store = window.TopBinsStorage.recordResult(activeModeKey, activeDateStr, totalScore);
    renderTierBreakdown(tierBreakdown);

    const shareText = window.TopBinsShare.buildShareCard({
      modeKey: activeModeKey,
      dateStr: activeDateStr,
      pointsSequence,
      totalScore,
      maxScore,
      streak: store.streak,
    });

    const shareBtn = document.getElementById("btn-share");
    shareBtn.onclick = async () => {
      const ok = await window.TopBinsShare.copyShareCard(shareText);
      shareBtn.textContent = ok ? "Copied!" : "Copy failed — long-press to copy";
      setTimeout(() => (shareBtn.textContent = "Copy share card"), 1800);
    };

    showScreen("screen-results");
    renderHomeStats();
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

  document.getElementById("btn-deep-cut").addEventListener("click", startDeepCut);
  document.getElementById("btn-club").addEventListener("click", () => {
    renderClubGrid();
    showScreen("screen-club-picker");
  });
  document.getElementById("btn-transfer").addEventListener("click", startTransferMode);

  document.getElementById("guess-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("guess-input");
    const text = input.value.trim();
    if (!text || !activeGame) return;
    activeGame.submitGuess(text);
  });

  renderHomeStats();
  renderTransferHomeCard();
})();
