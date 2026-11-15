(function () {
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
      const value = Math.round(from + (to - from) * eased);
      el.textContent = value;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------- Game flow ----------

  let activeGame = null;
  const MODE_KEY = "deep-cut";
  const DATE_STR = window.TopBinsSeed.todayDateString();

  async function startDeepCut() {
    const pack = await loadPack("prompts/deep-cut.json");
    const todays = window.TopBinsSeed.seededPick(pack.prompts, 7, `deep-cut:${DATE_STR}`);
    launchGame(todays);
  }

  function launchGame(prompts) {
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
    document.getElementById("running-score").textContent = "0";
    hideAutocomplete();
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
    hideAutocomplete();
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
    hideAutocomplete();
    document.getElementById("guess-input").focus();
  }

  function onScored({ result, totalScore }) {
    const previousTotal = totalScore - result.points;
    showTierReveal(result, () => {
      animateCount(document.getElementById("running-score"), previousTotal, totalScore);
      activeGame.advance();
    });
  }

  const TIER_MIN = 10;
  const TIER_MAX = 100;

  function showTierReveal(result, onDone) {
    const overlay = document.getElementById("tier-reveal");
    const nameEl = document.getElementById("reveal-name");
    const pointsEl = document.getElementById("reveal-points");
    const answerEl = document.getElementById("reveal-answer");
    const fillEl = document.getElementById("rarity-fill");
    const markerEl = document.getElementById("rarity-marker");

    nameEl.textContent = result.tierName;
    nameEl.className = `tier-name tier-${result.points}`;
    pointsEl.textContent = `+${result.points} points`;
    pointsEl.className = `tier-points tier-${result.points}`;
    answerEl.textContent = result.timedOut ? "Time's up." : `"${result.matchedName}"`;

    const pct = result.points === 0 ? 0 : Math.max(0, Math.min(100, ((result.points - TIER_MIN) / (TIER_MAX - TIER_MIN)) * 100));
    fillEl.className = `rarity-fill tier-${result.points}`;
    fillEl.style.width = "0%";
    markerEl.style.left = "0%";

    // restart animations
    nameEl.style.animation = "none";
    pointsEl.style.animation = "none";
    answerEl.style.animation = "none";
    requestAnimationFrame(() => {
      nameEl.style.animation = "";
      pointsEl.style.animation = "";
      answerEl.style.animation = "";
      requestAnimationFrame(() => {
        fillEl.style.width = `${pct}%`;
        markerEl.style.left = `${pct}%`;
      });
    });

    overlay.classList.add("active");
    setTimeout(() => {
      overlay.classList.remove("active");
      onDone();
    }, 1600);
  }

  function onGameEnd({ totalScore, maxScore, tierBreakdown, pointsSequence }) {
    document.getElementById("final-max").textContent = maxScore;

    const store = window.TopBinsStorage.recordResult(MODE_KEY, DATE_STR, totalScore);
    renderTierBreakdown(tierBreakdown);

    document.getElementById("results-streak").textContent = store.streak || 0;
    document.getElementById("results-best").textContent = window.TopBinsStorage.getBest(MODE_KEY);

    const shareText = window.TopBinsShare.buildShareCard({
      dateStr: DATE_STR,
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

    const finalScoreEl = document.getElementById("final-score");
    finalScoreEl.textContent = "0";
    setTimeout(() => animateCount(finalScoreEl, 0, totalScore, 1000), 150);
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

  // ---------- Autocomplete ----------

  let suggestions = [];
  let activeSuggestionIndex = -1;

  function hideAutocomplete() {
    suggestions = [];
    activeSuggestionIndex = -1;
    const list = document.getElementById("autocomplete-list");
    list.innerHTML = "";
    list.classList.remove("open");
  }

  function renderAutocomplete() {
    const list = document.getElementById("autocomplete-list");
    list.innerHTML = "";
    if (suggestions.length === 0) {
      list.classList.remove("open");
      return;
    }
    suggestions.forEach((ans, i) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item" + (i === activeSuggestionIndex ? " active" : "");
      item.textContent = ans.name;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        pickSuggestion(i);
      });
      list.appendChild(item);
    });
    list.classList.add("open");
  }

  function pickSuggestion(i) {
    const input = document.getElementById("guess-input");
    input.value = suggestions[i].name;
    hideAutocomplete();
    input.focus();
  }

  document.getElementById("guess-input").addEventListener("input", (e) => {
    if (!activeGame || !activeGame.currentPrompt) return;
    suggestions = window.TopBinsFuzzy.filterSuggestions(e.target.value, activeGame.currentPrompt.answers);
    activeSuggestionIndex = -1;
    renderAutocomplete();
  });

  document.getElementById("guess-input").addEventListener("keydown", (e) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
      renderAutocomplete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
      renderAutocomplete();
    } else if (e.key === "Enter" && activeSuggestionIndex >= 0) {
      e.preventDefault();
      pickSuggestion(activeSuggestionIndex);
    } else if (e.key === "Escape") {
      hideAutocomplete();
    }
  });

  document.getElementById("guess-input").addEventListener("blur", () => {
    setTimeout(hideAutocomplete, 100);
  });

  // ---------- Wiring ----------

  document.getElementById("btn-play").addEventListener("click", startDeepCut);

  document.getElementById("guess-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("guess-input");
    const text = input.value.trim();
    hideAutocomplete();
    if (!text || !activeGame) return;
    activeGame.submitGuess(text);
  });

  renderHomeStats();
})();
