// Core game engine: timer, scoring, tier reveal. No framework, callback-driven.

const TIER_NAMES = {
  0: "Blocked",
  10: "Tap-In",
  25: "Placed Finish",
  50: "Curler",
  70: "Volley",
  85: "Screamer",
  100: "Top Bins",
};

const PROMPT_SECONDS = 25;

class TopBinsGame {
  constructor(prompts, handlers) {
    this.prompts = prompts; // array of { id, text, answers: [{name, tier}] }
    this.handlers = handlers || {};
    this.index = -1;
    this.results = []; // { promptId, points, tierName, matchedName, timedOut }
    this.timerId = null;
    this.secondsLeft = PROMPT_SECONDS;
    this.locked = false; // true once current prompt is scored
  }

  get currentPrompt() {
    return this.prompts[this.index];
  }

  get totalScore() {
    return this.results.reduce((s, r) => s + r.points, 0);
  }

  get maxScore() {
    return this.prompts.length * 100;
  }

  start() {
    this.next();
  }

  next() {
    this.index++;
    if (this.index >= this.prompts.length) {
      this._end();
      return;
    }
    this.secondsLeft = PROMPT_SECONDS;
    this.locked = false;
    this._emit("promptStart", { index: this.index, prompt: this.currentPrompt, total: this.prompts.length });
    this._emit("tick", this.secondsLeft);
    this._clearTimer();
    this.timerId = setInterval(() => this._tick(), 1000);
  }

  _tick() {
    if (this.locked) return;
    this.secondsLeft--;
    this._emit("tick", this.secondsLeft);
    if (this.secondsLeft <= 0) {
      this._clearTimer();
      this._score(null, true);
    }
  }

  submitGuess(rawText) {
    if (this.locked) return null;
    const match = window.TopBinsFuzzy.matchAnswer(rawText, this.currentPrompt.answers);
    if (match) {
      this._clearTimer();
      this._score(match, false);
      return { correct: true, tier: match.tier, tierName: TIER_NAMES[match.tier], name: match.name };
    }
    this._emit("wrongGuess", rawText);
    return { correct: false };
  }

  _score(match, timedOut) {
    this.locked = true;
    const points = match ? match.tier : 0;
    const result = {
      promptId: this.currentPrompt.id,
      points,
      tierName: TIER_NAMES[points],
      matchedName: match ? match.name : null,
      timedOut,
    };
    this.results.push(result);
    this._emit("scored", { result, totalScore: this.totalScore, index: this.index, total: this.prompts.length });
  }

  advance() {
    this.next();
  }

  _end() {
    this._clearTimer();
    const tierBreakdown = {};
    for (const r of this.results) {
      tierBreakdown[r.points] = (tierBreakdown[r.points] || 0) + 1;
    }
    this._emit("gameEnd", {
      results: this.results,
      totalScore: this.totalScore,
      maxScore: this.maxScore,
      tierBreakdown,
      pointsSequence: this.results.map((r) => r.points),
    });
  }

  _clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  _emit(event, payload) {
    if (this.handlers[event]) this.handlers[event](payload);
  }
}

window.TopBinsGame = TopBinsGame;
window.TopBinsTierNames = TIER_NAMES;
window.TOP_BINS_PROMPT_SECONDS = PROMPT_SECONDS;
